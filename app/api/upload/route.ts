import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import User from "@/models/User"
import { pusherServer } from "@/lib/pusher-server"
import { v2 as cloudinary } from "cloudinary"
import type { UploadApiResponse } from "cloudinary"
import pdf from "pdf-parse/lib/pdf-parse.js"

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
})

export async function POST(req: Request) {

  try {

    await connectDB()

    const formData = await req.formData()

    const file = formData.get("file") as File
    const printType = formData.get("printType") as string
    const firebaseUID = formData.get("firebaseUID") as string
    const requestType = formData.get("requestType") as string
    const supplier = formData.get("supplier") as string

    // NEW FIELDS
    const alternatePhone = formData.get("alternatePhone") as string
    const duplex = formData.get("duplex") as string
    const instruction = formData.get("instruction") as string

    if (!file) {
      return NextResponse.json(
        { error: "File missing" },
        { status: 400 }
      )
    }

    if (!firebaseUID) {
      return NextResponse.json(
        { error: "User authentication required" },
        { status: 401 }
      )
    }

    // Allowed file types
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg"
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      )
    }

    // Verify user
    const user = await User.findOne({ firebaseUID })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 403 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Detect pages
    let pages = 1

    if (file.type === "application/pdf") {
      try {
        const data = await pdf(buffer)
        pages = data.numpages
      } catch (err) {
        console.error("PDF parse error:", err)
        pages = 1
      }
    }

    // Price calculation
    const priceMap: Record<string, number> = {
      bw: 2,
      color: 5,
      glossy: 15
    }

    const pricePerPage = priceMap[printType] || 2
    const estimatedPrice = pages * pricePerPage

    // Detect file type for Cloudinary
    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    const resourceType = (isImage || isPdf) ? "image" : "raw"

    const originalFileName = (file.name || `file-${Date.now()}`).trim()

    const sanitizedBaseName = originalFileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "file"

    // Upload file to Cloudinary
    const upload = await new Promise<UploadApiResponse>((resolve, reject) => {

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: "printmypage",
          public_id: `${sanitizedBaseName}-${Date.now()}`,
          filename_override: originalFileName
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result!)
        }
      )

      uploadStream.end(buffer)

    })

    // CREATE ORDER
    const order = await Order.create({

      userUID: firebaseUID,

      supplierUID:
        requestType === "specific" && supplier
          ? supplier
          : null,

      requestType: requestType || "global",

      alternatePhone: alternatePhone || "",

      duplex: duplex === "true",

      instruction: instruction || "",

      fileURL: upload.secure_url,

      pages,

      printType,

      estimatedPrice,

      status: "pending"

    })

    // Real-time broadcast
    await pusherServer.trigger(
      "orders",
      "new-order",
      order
    )

    return NextResponse.json({
      success: true,
      pages,
      estimatedPrice,
      order
    })

  } catch (err) {

    console.error("UPLOAD ERROR:", err)

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )

  }

}