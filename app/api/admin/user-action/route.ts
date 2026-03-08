import { NextResponse } from "next/server"
import { authenticateAdminRequest } from "@/lib/admin-auth"
import User from "@/models/User"
import Order from "@/models/Order"

export async function POST(req: Request) {
  const auth = await authenticateAdminRequest(req)
  if (!auth.ok) return auth.response

  const body = await req.json()

  const firebaseUID = body.firebaseUID as string | undefined
  const action = body.action as string | undefined

  if (!firebaseUID || !action) {
    return NextResponse.json(
      { success: false, message: "firebaseUID and action are required" },
      { status: 400 }
    )
  }

  if (firebaseUID === auth.uid && ["delete", "deactivate"].includes(action)) {
    return NextResponse.json(
      { success: false, message: "Owner cannot deactivate/delete self" },
      { status: 400 }
    )
  }

  if (action === "set_role") {
    const role = body.role as "USER" | "SUPPLIER" | "ADMIN" | undefined
    if (!role) {
      return NextResponse.json(
        { success: false, message: "Role is required" },
        { status: 400 }
      )
    }

    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { role },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user })
  }

  if (action === "activate" || action === "deactivate") {
    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { active: action === "activate" },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user })
  }

  if (action === "approve" || action === "disapprove") {
    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { approved: action === "approve" },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user })
  }

  if (action === "delete") {
    await Promise.all([
      User.deleteOne({ firebaseUID }),
      Order.deleteMany({ userUID: firebaseUID })
    ])

    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { success: false, message: "Unknown action" },
    { status: 400 }
  )
}
