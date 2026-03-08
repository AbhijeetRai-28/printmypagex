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
PRINTMYPAGEPSIT – OFFICIAL PROOF THAT YOU PAID US
================================================================

Receipt Generated On : ${paidDate}

CUSTOMER DETAILS
----------------------------------------------------------------------
Name                 : ${user?.name || "Unknown Human"}
User UID             : ${order.userUID}
Assigned Supplier    : ${supplier?.name || "The Mysterious Printer Operator"}

ORDER INFORMATION
----------------------------------------------------------------------
Order ID             : ${String(order._id)}
Razorpay Order ID    : ${order.razorpayOrderId || "N/A"}
Razorpay Payment ID  : ${order.razorpayPaymentId || "N/A"}

PRINTING DETAILS
----------------------------------------------------------------------
Print Type           : ${order.printType}
Total Pages          : ${order.verifiedPages || order.pages}
Amount Paid          : INR ${amount}
Payment Status       : ${order.paymentStatus.toUpperCase()}

================================================================

CONGRATULATIONS!
Your payment has been successfully captured.

Somewhere, a printer has started warming up
and preparing to scream like a jet engine.

Stand by while our technology performs its ancient ritual.

IMPORTANT ANNOUNCEMENT
----------------------------------------------------------------------
The following items were harmed during this process:

- Several sheets of innocent paper
- A small amount of printer ink
- Possibly the printer's mental stability

================================================================

Thank you for trusting PrintMyPagePSIT
to convert your panic into paper.

Developed with caffeine, debugging tears,
and questionable life decisions by

Abhinav Sahu
Developer of PrintMyPagePSIT
Contact: 9793404007

----------------------------------------------------------------------
This is a computer-generated receipt.
No signature required because printers sadly cannot hold pens.
`.trim()

    return new Response(fileBody, {
      status: 200,
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="receipt-${String(order._id)}.doc"`
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