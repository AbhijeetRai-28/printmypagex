import { NextResponse } from "next/server"
import { authenticateAdminRequest } from "@/lib/admin-auth"
import User from "@/models/User"
import Supplier from "@/models/Supplier"
import Order from "@/models/Order"

const CONFIRM_PHRASE = "CLEAR ENTIRE DATABASE"

export async function POST(req: Request) {
  const auth = await authenticateAdminRequest(req)
  if (!auth.ok) return auth.response

  const body = await req.json()

  const confirmText = String(body.confirmText || "").trim()
  const ownerEmail = String(body.ownerEmail || "").trim().toLowerCase()

  if (confirmText !== CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        success: false,
        message: `Type exact confirmation phrase: ${CONFIRM_PHRASE}`
      },
      { status: 400 }
    )
  }

  if (ownerEmail !== auth.email) {
    return NextResponse.json(
      {
        success: false,
        message: "Owner email confirmation does not match signed-in account"
      },
      { status: 400 }
    )
  }

  const [usersResult, suppliersResult, ordersResult] = await Promise.all([
    User.deleteMany({ role: { $ne: "ADMIN" } }),
    Supplier.deleteMany({}),
    Order.deleteMany({})
  ])

  return NextResponse.json({
    success: true,
    message: "Database cleared except admin accounts",
    deleted: {
      users: usersResult.deletedCount,
      suppliers: suppliersResult.deletedCount,
      orders: ordersResult.deletedCount
    }
  })
}
