// import { NextResponse } from "next/server"
// import razorpay from "@/lib/razorpay"

// export async function POST(req:Request){

// const body = await req.json()

// const order = await razorpay.orders.create({
// amount: body.amount * 100,
// currency: "INR",
// receipt: "receipt_"+Date.now()
// })

// return NextResponse.json(order)

// }
import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"

export async function POST(req: Request) {

  try {

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({
        success: false,
        message: "Payment system not configured yet"
      })
    }

    const body = await req.json()
    const { orderId, userUID } = body

    if (!orderId || !userUID) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing order details"
        },
        { status: 400 }
      )
    }

    await connectDB()

    const dbOrder = await Order.findById(orderId)

    if (!dbOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found"
        },
        { status: 404 }
      )
    }

    if (dbOrder.userUID !== userUID) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized payment request"
        },
        { status: 403 }
      )
    }

    if (dbOrder.paymentStatus === "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "Order already paid"
        },
        { status: 409 }
      )
    }

    if (dbOrder.status !== "awaiting_payment") {
      return NextResponse.json(
        {
          success: false,
          message: "Order is not ready for payment"
        },
        { status: 409 }
      )
    }

    const payableAmount = Number(dbOrder.finalPrice ?? dbOrder.estimatedPrice ?? 0)

    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payable amount"
        },
        { status: 400 }
      )
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })

    const shortOrderId = String(dbOrder._id).slice(-10)
    const shortTs = Date.now().toString().slice(-8)
    const receipt = `rcpt_${shortOrderId}_${shortTs}`.slice(0, 40)

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(payableAmount * 100),
      currency: "INR",
      receipt,
      notes: {
        orderId: String(dbOrder._id),
        userUID: dbOrder.userUID
      }
    })

    dbOrder.razorpayOrderId = razorpayOrder.id
    await dbOrder.save()

    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      orderId: String(dbOrder._id),
      payableAmount
    })

  } catch (error) {

    console.log("RAZORPAY ERROR:", error)

    return NextResponse.json({
      success: false,
      message: "Payment failed"
    }, { status: 500 })

  }

}
