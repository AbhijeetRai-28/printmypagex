import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(req: Request) {

  try {
    await connectDB()

    const body = await req.json()

    if (!body.firebaseUID) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing firebaseUID"
        },
        { status: 400 }
      )
    }

    const user = await User.findOneAndUpdate(
      { firebaseUID: body.firebaseUID },
      {
        firebaseUID: body.firebaseUID,
        email: body.email || undefined,
        name: body.name,
        rollNo: body.rollNo,
        branch: body.branch,
        year: body.year,
        section: body.section,
        phone: body.phone
      },
      {
        upsert: true,
        new: true
      }
    )

    console.log("USER_PROFILE_DEBUG: Profile upserted", {
      firebaseUID: body.firebaseUID,
      hasEmail: Boolean(body.email)
    })

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully",
      user
    })
  } catch (error) {
    console.error("USER_PROFILE_DEBUG: Create/Update failed", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save profile"
      },
      { status: 500 }
    )
  }
}
