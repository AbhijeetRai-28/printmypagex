import Order from "@/models/Order"

const DAY_IN_MS = 24 * 60 * 60 * 1000
const PENDING_AUTO_CANCEL_AGE_MS = 3 * DAY_IN_MS
const PAYMENT_AUTO_CANCEL_AGE_MS = DAY_IN_MS

type LifecycleScope = {
  userUID?: string
  supplierUID?: string
}

type LifecycleSummary = {
  movedToPrinting: number
  cancelledPending: number
  cancelledAwaitingPayment: number
}

function getScopeFilter(scope: LifecycleScope) {
  const filter: Record<string, unknown> = {}

  if (scope.userUID) {
    filter.userUID = scope.userUID
  }

  if (scope.supplierUID) {
    filter.supplierUID = scope.supplierUID
  }

  return filter
}

export async function applyOrderLifecycleRules(
  scope: LifecycleScope = {}
): Promise<LifecycleSummary> {
  const now = new Date()
  const pendingCutoff = new Date(now.getTime() - PENDING_AUTO_CANCEL_AGE_MS)
  const paymentCutoff = new Date(now.getTime() - PAYMENT_AUTO_CANCEL_AGE_MS)
  const scopeFilter = getScopeFilter(scope)

  const movedToPrintingResult = await Order.updateMany(
    {
      ...scopeFilter,
      paymentStatus: "paid",
      status: { $in: ["awaiting_payment", "accepted"] }
    },
    {
      $set: { status: "printing" },
      $push: {
        logs: {
          message: "Auto-moved to printing because payment is completed",
          time: now
        }
      }
    }
  )

  const cancelledPendingResult = await Order.updateMany(
    {
      ...scopeFilter,
      status: "pending",
      paymentStatus: { $ne: "paid" },
      createdAt: { $lte: pendingCutoff }
    },
    {
      $set: {
        status: "cancelled",
        cancelledAt: now
      },
      $push: {
        logs: {
          message: "Order auto-cancelled after 3 days without supplier acceptance",
          time: now
        }
      }
    }
  )

  const cancelledAwaitingPaymentResult = await Order.updateMany(
    {
      ...scopeFilter,
      status: { $in: ["awaiting_payment", "accepted"] },
      paymentStatus: { $ne: "paid" },
      $or: [
        {
          acceptedAt: { $ne: null, $lte: paymentCutoff }
        },
        {
          acceptedAt: null,
          createdAt: { $lte: paymentCutoff }
        }
      ]
    },
    {
      $set: {
        status: "cancelled",
        cancelledAt: now
      },
      $push: {
        logs: {
          message: "Order auto-cancelled because payment was not completed within 1 day of acceptance",
          time: now
        }
      }
    }
  )

  return {
    movedToPrinting: Number(movedToPrintingResult.modifiedCount || 0),
    cancelledPending: Number(cancelledPendingResult.modifiedCount || 0),
    cancelledAwaitingPayment: Number(cancelledAwaitingPaymentResult.modifiedCount || 0)
  }
}
