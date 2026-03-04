import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const firebaseUID = searchParams.get("firebaseUID")

  if (!firebaseUID) {
    return NextResponse.json({ error: "Missing UID" }, { status: 400 })
  }

  await connectDB()

  const user = await User.findOne({ firebaseUID })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user })
}