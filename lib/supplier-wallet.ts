import Order from "@/models/Order"
import SupplierPayoutRequest from "@/models/SupplierPayoutRequest"

export const RAZORPAY_FEE_RATE = 0.02
export const GST_ON_FEE_RATE = 0.18

export type SupplierWalletSummary = {
  grossDeliveredRevenue: number
  razorpayFees: number
  gstOnFees: number
  netRevenue: number
  totalClaimed: number
  pendingRequested: number
  availableToClaim: number
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export async function getSupplierWalletSummary(supplierUID: string): Promise<SupplierWalletSummary> {
  const [deliveredAgg, payoutAgg] = await Promise.all([
    Order.aggregate<{ grossDeliveredRevenue: number }>([
      {
        $match: {
          supplierUID,
          status: "delivered",
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: null,
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
    SupplierPayoutRequest.aggregate<{ _id: string; total: number }>([
      {
        $match: {
          supplierUID,
          status: { $in: ["pending", "approved"] }
        }
      },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" }
        }
      }
    ])
  ])

  const grossDeliveredRevenue = round2(deliveredAgg[0]?.grossDeliveredRevenue || 0)
  const razorpayFees = round2(grossDeliveredRevenue * RAZORPAY_FEE_RATE)
  const gstOnFees = round2(razorpayFees * GST_ON_FEE_RATE)
  const netRevenue = round2(grossDeliveredRevenue - razorpayFees - gstOnFees)

  const totalClaimed = round2(
    payoutAgg.find((item) => item._id === "approved")?.total || 0
  )

  const pendingRequested = round2(
    payoutAgg.find((item) => item._id === "pending")?.total || 0
  )

  const availableToClaim = round2(Math.max(0, netRevenue - totalClaimed - pendingRequested))

  return {
    grossDeliveredRevenue,
    razorpayFees,
    gstOnFees,
    netRevenue,
    totalClaimed,
    pendingRequested,
    availableToClaim
  }
}
