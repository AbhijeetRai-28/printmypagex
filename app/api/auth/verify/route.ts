import { NextResponse } from "next/server"
import { authenticateUserRequest } from "@/lib/user-auth"

export async function POST(req: Request) {
  const auth = await authenticateUserRequest(req, {
    requireProfile: false,
    requireActive: false
  })
  if (!auth.ok) return auth.response

  return NextResponse.json({
    success: true,
    uid: auth.uid,
    email: auth.email
  })
}
