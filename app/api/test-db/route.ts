import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"

export async function GET(req: Request) {
  try {
    const testRoutesEnabled = process.env.ENABLE_TEST_ENDPOINTS === "true"
    const debugKey = process.env.TEST_DB_KEY
    const headerKey = req.headers.get("x-test-db-key")

    if (!testRoutesEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: "Test DB endpoint is disabled"
        },
        { status: 404 }
      )
    }

    if (!debugKey) {
      return NextResponse.json(
        {
          success: false,
          message: "TEST_DB_KEY is not configured"
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

    await connectDB()

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully"
    })
  } catch (error) {
    console.error("TEST_DB_ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed"
      },
      { status: 500 }
    )
  }
}
