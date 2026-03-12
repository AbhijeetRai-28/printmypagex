import { NextResponse } from "next/server"
import { authenticateAdminRequest } from "@/lib/admin-auth"
import { connectDB } from "@/lib/mongodb"
import Feedback from "@/models/Feedback"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await authenticateAdminRequest(req)
  if (!auth.ok) return auth.response

  await connectDB()

  const feedbacks = await Feedback.find({})
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({
    success: true,
    feedbacks
  })
}
