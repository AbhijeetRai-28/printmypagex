import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(req: Request){

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

  const user = await User.findOne({
    firebaseUID: body.firebaseUID
  })

  if(user){
    if (body.email) {
      await User.updateOne(
        { firebaseUID: body.firebaseUID },
        {
          $set: {
            email: body.email
          }
        }
      )
      console.log("USER_PROFILE_DEBUG: Synced email from login", {
        firebaseUID: body.firebaseUID,
        hasEmailInBody: Boolean(body.email)
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
