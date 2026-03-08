import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Supplier from "@/models/Supplier"
import User from "@/models/User"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    await connectDB()

    const body = await req.json()
    const firebaseUID = body?.firebaseUID as string | undefined
    const email = body?.email as string | undefined

    if (!firebaseUID) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing firebaseUID"
        },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing email"
        },
        { status: 400 }
      )
    }

    const supplier = await Supplier.findOneAndUpdate(
      { firebaseUID },
      {
        $set: {
          email
        }
      },
      { new: true }
    )

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier not found"
        },
        { status: 404 }
      )
    }

    await User.findOneAndUpdate(
      { firebaseUID },
      {
        $set: {
          email
        }
      },
      { new: true }
    )

    console.log("SUPPLIER_PROFILE_DEBUG: Synced supplier email", {
      firebaseUID,
      email
    })

    return NextResponse.json({
      success: true,
      message: "Supplier email synced"
    })
  } catch (error) {
    console.error("SUPPLIER_PROFILE_DEBUG: Failed to sync supplier email", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync supplier email"
      },
      { status: 500 }
    )
  }
}
