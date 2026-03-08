import { NextResponse } from "next/server"
import { authenticateAdminRequest } from "@/lib/admin-auth"
import User from "@/models/User"
import Order from "@/models/Order"

type UserDoc = {
  firebaseUID?: string
  [key: string]: unknown
}

export async function GET(req: Request) {
  const auth = await authenticateAdminRequest(req)
  if (!auth.ok) return auth.response

  const users = (await User.find({})
    .sort({ createdAt: -1 })
    .lean()) as UserDoc[]

  const orderStats = await Order.aggregate<{
    _id: string
    orderCount: number
    totalSpent: number
    paidCount: number
  }>([
    {
      $group: {
        _id: "$userUID",
        orderCount: { $sum: 1 },
        totalSpent: {
          $sum: {
            $cond: [{ $ifNull: ["$finalPrice", false] }, "$finalPrice", "$estimatedPrice"]
          }
        },
        paidCount: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0]
          }
        }
      }
    }
  ])

  const statsMap = new Map<string, { orderCount: number; totalSpent: number; paidCount: number }>()
  for (const stat of orderStats) {
    statsMap.set(String(stat._id), {
      orderCount: stat.orderCount || 0,
      totalSpent: stat.totalSpent || 0,
      paidCount: stat.paidCount || 0
    })
  }

  const rows = users.map((user) => {
    const stats = statsMap.get(String(user.firebaseUID)) || {
      orderCount: 0,
      totalSpent: 0,
      paidCount: 0
    }

    return {
      ...user,
      orderCount: stats.orderCount,
      totalSpent: stats.totalSpent,
      paidCount: stats.paidCount
    }
  })

  return NextResponse.json({
    success: true,
    users: rows
  })
}
