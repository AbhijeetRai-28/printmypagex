import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { authenticateUserRequest } from "@/lib/user-auth"

export async function POST(req: Request){
  const auth = await authenticateUserRequest(req, {
    requireProfile: false,
    requireActive: false
  })
  if (!auth.ok) return auth.response

  await connectDB()

  const body = await req.json()

  if (!body?.firebaseUID) {
    return NextResponse.json(
      {
        exists: false,
        message: "Missing firebaseUID"
      },
      { status: 400 }
    )
  }

  if (body.firebaseUID !== auth.uid) {
    return NextResponse.json(
      {
        exists: false,
        message: "Unauthorized UID"
      },
      { status: 403 }
    )
  }

  const user = await User.findOne({
    firebaseUID: body.firebaseUID
  })

  if(user){
    if (body.email || body.photoURL) {
      await User.updateOne(
        { firebaseUID: body.firebaseUID },
        {
          $set: {
            ...(body.email ? { email: body.email } : {}),
            ...(body.photoURL ? { firebasePhotoURL: body.photoURL } : {})
          }
        }
      )
      console.log("USER_PROFILE_DEBUG: Synced email from login", {
        firebaseUID: body.firebaseUID,
        hasEmailInBody: Boolean(body.email),
        hasPhotoURLInBody: Boolean(body.photoURL)
      })
    }

    return NextResponse.json({
      exists: true
    })
  }

  return NextResponse.json({
    exists: false
  })
}
