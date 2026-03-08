import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import Supplier from "@/models/Supplier"
import { v2 as cloudinary } from "cloudinary"
import type { UploadApiResponse } from "cloudinary"

export const runtime = "nodejs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
})

export async function POST(req: Request) {
  try {
    await connectDB()

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const firebaseUID = String(formData.get("firebaseUID") || "").trim()

    if (!firebaseUID) {
      return NextResponse.json(
        { success: false, message: "Missing firebaseUID" },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File is required" },
        { status: 400 }
      )
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Only image files are allowed" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const upload = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "printmypage/profile",
          public_id: `user-${firebaseUID}-${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result!)
        }
      )

      stream.end(buffer)
    })

    const photoURL = upload.secure_url

    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { $set: { photoURL } },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    await Supplier.findOneAndUpdate(
      { firebaseUID },
      { $set: { photoURL } },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: "Profile photo updated",
      photoURL,
      user: {
        ...user.toObject(),
        displayPhotoURL: photoURL || user.firebasePhotoURL || ""
      }
    })
  } catch (error) {
    console.error("USER_UPLOAD_PHOTO_ERROR:", error)
    return NextResponse.json(
      { success: false, message: "Failed to upload profile photo" },
      { status: 500 }
    )
  }
}
