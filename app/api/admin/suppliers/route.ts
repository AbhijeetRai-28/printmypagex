import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Supplier from "@/models/Supplier"
import Order from "@/models/Order"
import SupplierPayoutRequest from "@/models/SupplierPayoutRequest"
import { authenticateAdminRequest } from "@/lib/admin-auth"
import { GST_ON_FEE_RATE, RAZORPAY_FEE_RATE } from "@/lib/supplier-wallet"

type SupplierDoc = {
  _id: string
  firebaseUID?: string
  [key: string]: unknown
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export async function GET(req: Request){
  const auth = await authenticateAdminRequest(req)
  if (!auth.ok) return auth.response

  await connectDB()

  const suppliers = (await Supplier.find({})
    .sort({ createdAt: -1 })
    .lean()) as SupplierDoc[]

  const [deliveredStats, orderStats, payoutStats] = await Promise.all([
    Order.aggregate<{
      _id: string
      grossDeliveredRevenue: number
    }>([
      {
        $match: {
          supplierUID: { $ne: null },
          status: "delivered",
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: "$supplierUID",
          grossDeliveredRevenue: {
            $sum: {
              $cond: [
                { $ifNull: ["$finalPrice", false] },
                "$finalPrice",
                "$estimatedPrice"
              ]
            }
          }
        }
      }
    ]),
    Order.aggregate<{
      _id: string
      ordersHandled: number
      paidOrders: number
    }>([
      {
        $match: {
          supplierUID: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$supplierUID",
          ordersHandled: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0]
            }
          }
        }
      }
    ]),
    SupplierPayoutRequest.aggregate<{
      _id: { supplierUID: string; status: string }
      total: number
    }>([
      {
        $group: {
          _id: {
            supplierUID: "$supplierUID",
            status: "$status"
          },
          total: { $sum: "$amount" }
        }
      }
    ])
  ])

  const deliveredMap = new Map<string, number>()
  deliveredStats.forEach((stat) => {
    deliveredMap.set(String(stat._id), round2(stat.grossDeliveredRevenue || 0))
  })

  const orderMap = new Map<string, { ordersHandled: number; paidOrders: number }>()
  orderStats.forEach((stat) => {
    orderMap.set(String(stat._id), {
      ordersHandled: stat.ordersHandled || 0,
      paidOrders: stat.paidOrders || 0
    })
  })

  const payoutMap = new Map<string, { approved: number; pending: number }>()
  payoutStats.forEach((stat) => {
    const supplierUID = String(stat._id.supplierUID)
    const current = payoutMap.get(supplierUID) || { approved: 0, pending: 0 }

    if (stat._id.status === "approved") {
      current.approved = round2(current.approved + (stat.total || 0))
    }

    if (stat._id.status === "pending") {
      current.pending = round2(current.pending + (stat.total || 0))
    }

    payoutMap.set(supplierUID, current)
  })

  const rows = suppliers.map((supplier) => {
    const supplierUID = String(supplier.firebaseUID || "")
    const grossDeliveredRevenue = deliveredMap.get(supplierUID) || 0
    const razorpayFees = round2(grossDeliveredRevenue * RAZORPAY_FEE_RATE)
    const gstOnFees = round2(razorpayFees * GST_ON_FEE_RATE)
    const netRevenue = round2(grossDeliveredRevenue - razorpayFees - gstOnFees)

    const payout = payoutMap.get(supplierUID) || { approved: 0, pending: 0 }
    const walletBalance = round2(Math.max(0, netRevenue - payout.approved))
    const availableToClaim = round2(Math.max(0, walletBalance - payout.pending))

    const order = orderMap.get(supplierUID) || { ordersHandled: 0, paidOrders: 0 }

    return {
      ...supplier,
      ordersHandled: order.ordersHandled,
      paidOrders: order.paidOrders,
      grossDeliveredRevenue,
      razorpayFees,
      gstOnFees,
      netRevenue,
      totalClaimed: payout.approved,
      pendingRequested: payout.pending,
      walletBalance,
      availableToClaim
    }
  })

  return NextResponse.json({
    success: true,
    suppliers: rows
  })

}
