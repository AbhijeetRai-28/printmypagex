import { NextResponse } from "next/server"
import { authenticateAdminRequest } from "@/lib/admin-auth"
import Order from "@/models/Order"
import User from "@/models/User"
import Supplier from "@/models/Supplier"

type OrderDoc = {
  _id: string
  userUID?: string
  supplierUID?: string | null
  [key: string]: unknown
}

type MinimalUser = {
  firebaseUID: string
  name?: string
  email?: string
}

type MinimalSupplier = {
  firebaseUID: string
  name?: string
  email?: string
  approved?: boolean
  active?: boolean
}

export async function GET(req: Request) {
  const auth = await authenticateAdminRequest(req)
  if (!auth.ok) return auth.response

  const orders = (await Order.find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .lean()) as OrderDoc[]

  const userUIDs = [...new Set(orders.map((order) => String(order.userUID || "")).filter(Boolean))]
  const supplierUIDs = [...new Set(orders.map((order) => String(order.supplierUID || "")).filter(Boolean))]

  const [users, suppliers] = await Promise.all([
    User.find({ firebaseUID: { $in: userUIDs } })
      .select("firebaseUID name email")
      .lean() as Promise<MinimalUser[]>,
    Supplier.find({ firebaseUID: { $in: supplierUIDs } })
      .select("firebaseUID name email approved active")
      .lean() as Promise<MinimalSupplier[]>
  ])

  const userMap = new Map<string, MinimalUser>()
  users.forEach((user) => userMap.set(String(user.firebaseUID), user))

  const supplierMap = new Map<string, MinimalSupplier>()
  suppliers.forEach((supplier) => supplierMap.set(String(supplier.firebaseUID), supplier))

  const rows = orders.map((order) => ({
    ...order,
    user: userMap.get(String(order.userUID || "")) || null,
    supplier: supplierMap.get(String(order.supplierUID || "")) || null
  }))

  return NextResponse.json({
    success: true,
    orders: rows
  })
}
