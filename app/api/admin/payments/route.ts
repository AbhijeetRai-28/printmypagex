import { NextResponse } from "next/server"
import { authenticateAdminRequest } from "@/lib/admin-auth"
import Order from "@/models/Order"
import User from "@/models/User"

type PaidOrderDoc = {
  _id: string
  userUID?: string
  finalPrice?: number
  estimatedPrice?: number
  paymentStatus?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  paidAt?: Date | null
  status?: string
  createdAt?: Date
}

type MinimalUser = {
  firebaseUID: string
  name?: string
  email?: string
}

export async function GET(req: Request) {
  const auth = await authenticateAdminRequest(req)
  if (!auth.ok) return auth.response

  const paidOrders = (await Order.find({
    $or: [{ paymentStatus: "paid" }, { razorpayPaymentId: { $ne: null } }]
  })
    .sort({ paidAt: -1, createdAt: -1 })
    .limit(500)
    .lean()) as PaidOrderDoc[]

  const userUIDs = [...new Set(paidOrders.map((order) => String(order.userUID || "")).filter(Boolean))]

  const users = (await User.find({ firebaseUID: { $in: userUIDs } })
    .select("firebaseUID name email")
    .lean()) as MinimalUser[]

  const userMap = new Map<string, MinimalUser>()
  users.forEach((user) => userMap.set(String(user.firebaseUID), user))

  const paymentLogs = paidOrders.map((order) => ({
    orderId: String(order._id),
    userUID: order.userUID,
    user: userMap.get(String(order.userUID || "")) || null,
    amount: order.finalPrice ?? order.estimatedPrice ?? 0,
    paymentStatus: order.paymentStatus,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    paidAt: order.paidAt,
    status: order.status,
    createdAt: order.createdAt
  }))

  return NextResponse.json({
    success: true,
    payments: paymentLogs
  })
}
