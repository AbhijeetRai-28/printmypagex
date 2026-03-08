import crypto from "crypto"
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { pusherServer } from "@/lib/pusher-server"
import { sendPaymentReceivedNotifications } from "@/lib/order-email"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment verification not configured"
        },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      orderId,
      userUID,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = body

    if (
      !orderId ||
      !userUID ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing payment verification fields"
        },
        { status: 400 }
      )
    }

    await connectDB()

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
          message: "Unauthorized verification request"
        },
        { status: 403 }
      )
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Order already paid",
        order
      })
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay order mismatch"
        },
        { status: 400 }
      )
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment signature verification failed"
        },
        { status: 400 }
      )
    }

    order.paymentStatus = "paid"
    order.razorpayOrderId = razorpay_order_id
    order.razorpayPaymentId = razorpay_payment_id
    order.razorpaySignature = razorpay_signature
    order.paidAt = new Date()
    order.logs.push({
      message: "Payment verified successfully",
      time: new Date()
    })

    await order.save()

    try {
      await pusherServer.trigger(`user-${order.userUID}`, "order-updated", order)
    } catch (pushError) {
      console.error("PUSHER USER PAYMENT UPDATE ERROR:", pushError)
    }

    try {
      if (order.supplierUID) {
        await pusherServer.trigger(`supplier-${order.supplierUID}`, "order-updated", order)
      }
    } catch (pushError) {
      console.error("PUSHER SUPPLIER PAYMENT UPDATE ERROR:", pushError)
    }

    sendPaymentReceivedNotifications(order).catch((emailError) => {
      console.error("PAYMENT_RECEIVED_EMAIL_ERROR:", emailError)
    })

    return NextResponse.json({
      success: true,
      message: "Payment verified",
      order
    })
  } catch (error) {
    console.error("PAYMENT VERIFY ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Payment verification failed"
      },
      { status: 500 }
    )
  }
}
