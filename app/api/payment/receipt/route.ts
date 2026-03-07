import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import User from "@/models/User"
import Supplier from "@/models/Supplier"

export async function GET(req: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")
    const userUID = searchParams.get("userUID")

    if (!orderId || !userUID) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing receipt details"
        },
        { status: 400 }
      )
    }

    const order = await Order.findById(orderId)

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found"
        },
        { status: 404 }
      )
    }

    if (order.userUID !== userUID) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized receipt request"
        },
        { status: 403 }
      )
    }

    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "Receipt available only after payment"
        },
        { status: 409 }
      )
    }

    const user = await User.findOne({ firebaseUID: order.userUID })
    const supplier = order.supplierUID
      ? await Supplier.findOne({ firebaseUID: order.supplierUID })
      : null

    const amount = Number(order.finalPrice ?? order.estimatedPrice ?? 0)
    const paidDate = order.paidAt
      ? new Date(order.paidAt).toLocaleString()
      : new Date().toLocaleString()

    const fileBody = `
PrintMyPage Payment Receipt
========================================
Receipt Date: ${paidDate}
Order ID: ${String(order._id)}
Razorpay Order ID: ${order.razorpayOrderId || "N/A"}
Razorpay Payment ID: ${order.razorpayPaymentId || "N/A"}

Customer Name: ${user?.name || "N/A"}
Customer UID: ${order.userUID}
Supplier: ${supplier?.name || "N/A"}

Print Type: ${order.printType}
Pages: ${order.verifiedPages || order.pages}
Amount Paid: INR ${amount}
Payment Status: ${order.paymentStatus.toUpperCase()}

Thank you for using PrintMyPage.
`.trim()

    return new Response(fileBody, {
      status: 200,
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"receipt-${String(order._id)}.doc\"`
      }
    })
  } catch (error) {
    console.error("RECEIPT DOWNLOAD ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate receipt"
      },
      { status: 500 }
    )
  }
}
