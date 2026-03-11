import { NextResponse } from "next/server"
import { sendAppEmail } from "@/lib/email"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const testRoutesEnabled = process.env.ENABLE_TEST_ENDPOINTS === "true"
    const debugKey = process.env.TEST_EMAIL_KEY
    const headerKey = req.headers.get("x-test-email-key")

    if (!testRoutesEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: "Test email endpoint is disabled"
        },
        { status: 404 }
      )
    }

    if (!debugKey) {
      return NextResponse.json(
        {
          success: false,
          message: "TEST_EMAIL_KEY is not configured"
        },
        { status: 500 }
      )
    }

    if (headerKey !== debugKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized test request"
        },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const to =
      (typeof body?.to === "string" ? body.to : "") ||
      process.env.EMAIL_REPLY_TO ||
      process.env.GMAIL_USER

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          message: "No recipient found. Pass { to } in request body."
        },
        { status: 400 }
      )
    }

    await sendAppEmail({
      to,
      subject: "PrintMyPage SMTP Test",
      html: "<h2>Test Email</h2><p>If you received this, your mail setup works.</p>"
    })

    return NextResponse.json({
      success: true,
      message: "Test email sent",
      to
    })
  } catch (error) {
    console.error("TEST_EMAIL_ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send test email"
      },
      { status: 500 }
    )
  }
}
