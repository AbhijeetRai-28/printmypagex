import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Supplier from "@/models/Supplier"
import { authenticateUserRequest } from "@/lib/user-auth"

export async function GET(req: Request) {
  const auth = await authenticateUserRequest(req, {
    requireProfile: false,
    requireActive: false
  })
  if (!auth.ok) return auth.response

  await connectDB()

  const suppliers = await Supplier.find({
    approved: true,
    active: true
  })
    .select("firebaseUID name branch year")
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({
    success: true,
    suppliers
  })
}
