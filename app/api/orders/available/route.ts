import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import Supplier from "@/models/Supplier"

export async function GET(req: Request) {

  await connectDB()

  const { searchParams } = new URL(req.url)

  const supplierUID = searchParams.get("supplierUID")

  if (!supplierUID) {
    return NextResponse.json(
      { error: "Supplier UID missing" },
      { status: 400 }
    )
  }

  /* verify supplier exists */

  const supplier = await Supplier.findOne({
    firebaseUID: supplierUID
  })

  if (!supplier) {
    return NextResponse.json(
      { error: "Supplier not registered" },
      { status: 403 }
    )
  }

  if (!supplier.approved) {
    return NextResponse.json(
      { error: "Supplier not approved" },
      { status: 403 }
    )
  }

  if (!supplier.active) {
    return NextResponse.json(
      { error: "Supplier inactive" },
      { status: 403 }
    )
  }

  /* fetch available orders */

  const orders = await Order.find({

    status: "pending",

    $or: [
      { requestType: "global" },      // global orders
      { supplierUID: supplierUID },   // assigned to this supplier
      { supplierUID: null }           // unassigned orders
    ]

  }).sort({ createdAt: -1 })

  return NextResponse.json({
    success: true,
    orders
  })

}