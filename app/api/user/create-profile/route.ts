import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { isAlphabeticText, isNumeric, normalizeText } from "@/lib/form-validation"

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

    const name = normalizeText(String(body.name || ""))
    const rollNo = String(body.rollNo || "").trim()
    const branch = normalizeText(String(body.branch || ""))
    const section = normalizeText(String(body.section || ""))
    const phone = String(body.phone || "").trim()
    const year = Number(body.year)

    if (!name || !isAlphabeticText(name)) {
      return NextResponse.json(
        { success: false, message: "Name must contain only text" },
        { status: 400 }
      )
    }

    if (!rollNo || !isNumeric(rollNo)) {
      return NextResponse.json(
        { success: false, message: "Roll number must be numeric" },
        { status: 400 }
      )
    }

    if (!branch || !isAlphabeticText(branch)) {
      return NextResponse.json(
        { success: false, message: "Branch must contain only text" },
        { status: 400 }
      )
    }

    if (!section || !isAlphabeticText(section)) {
      return NextResponse.json(
        { success: false, message: "Section must contain only text" },
        { status: 400 }
      )
    }

    if (!Number.isInteger(year) || year < 1 || year > 8) {
      return NextResponse.json(
        { success: false, message: "Year must be a number between 1 and 8" },
        { status: 400 }
      )
    }

    if (!isNumeric(phone) || phone.length < 10 || phone.length > 15) {
      return NextResponse.json(
        { success: false, message: "Phone must be numeric (10-15 digits)" },
        { status: 400 }
      )
    }

    const user = await User.findOneAndUpdate(
      { firebaseUID: body.firebaseUID },
      {
        firebaseUID: body.firebaseUID,
        email: body.email || undefined,
        name,
        rollNo,
        branch,
        year,
        section,
        phone,
        approved: true
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
