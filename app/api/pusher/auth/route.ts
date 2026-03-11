import { NextResponse } from "next/server"
import Supplier from "@/models/Supplier"
import { authenticateUserRequest } from "@/lib/user-auth"
import { connectDB } from "@/lib/mongodb"
import { pusherServer } from "@/lib/pusher-server"
import { isOwnerEmail } from "@/lib/owner-access"

export async function POST(req: Request) {
  const auth = await authenticateUserRequest(req, {
    requireProfile: false,
    requireActive: false
  })
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => ({}))
  const socketId = String(body?.socket_id || "").trim()
  const channelName = String(body?.channel_name || "").trim()

  if (!socketId || !channelName) {
    return NextResponse.json(
      { success: false, message: "Missing socket_id or channel_name" },
      { status: 400 }
    )
  }

  if (!channelName.startsWith("private-user-") && !channelName.startsWith("private-supplier-")) {
    return NextResponse.json(
      { success: false, message: "Unsupported channel" },
      { status: 403 }
    )
  }

  const isUserChannel = channelName.startsWith("private-user-")
  const channelUID = channelName
    .replace(/^private-user-/, "")
    .replace(/^private-supplier-/, "")

  if (!channelUID || channelUID !== auth.uid) {
    return NextResponse.json(
      { success: false, message: "Channel access denied" },
      { status: 403 }
    )
  }

  if (!isUserChannel) {
    await connectDB()

    const supplier = await Supplier.findOne({ firebaseUID: auth.uid })
      .select("approved active")
      .lean()

    const ownerAccess = isOwnerEmail(auth.email)

    if (!ownerAccess && (!supplier || !supplier.approved || !supplier.active)) {
      return NextResponse.json(
        { success: false, message: "Supplier channel access denied" },
        { status: 403 }
      )
    }
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName)
  return NextResponse.json(authResponse)
}
