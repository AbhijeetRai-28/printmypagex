import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import {
  computeOverallFeedbackRating,
  parseFeedbackRatings
} from "@/lib/feedback"
import Feedback from "@/models/Feedback"

export const runtime = "nodejs"

function sanitizeText(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const payload =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {}

    const ratings = parseFeedbackRatings(payload)
    const message = sanitizeText(payload.message)

    if (!ratings) {
      return NextResponse.json(
        {
          success: false,
          message: "Please give a star rating for every feedback category."
        },
        { status: 400 }
      )
    }

    if (!message || message.length < 10 || message.length > 1500) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback message must be between 10 and 1500 characters."
        },
        { status: 400 }
      )
    }

    await connectDB()

    const feedback = await Feedback.create({
      ...ratings,
      overallRating: computeOverallFeedbackRating(ratings),
      message
    })

    return NextResponse.json({
      success: true,
      message: "Thanks for sharing your feedback.",
      feedbackId: String(feedback._id)
    })
  } catch (error) {
    console.error("PUBLIC_FEEDBACK_SUBMIT_ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Unable to save feedback right now. Please try again later."
      },
      { status: 500 }
    )
  }
}
