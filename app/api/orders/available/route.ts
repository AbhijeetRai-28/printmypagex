import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import User from "@/models/User"

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

  // 🔐 Verify supplier exists
  const supplier = await User.findOne({ firebaseUID: supplierUID })

  if (!supplier) {
    return NextResponse.json(
      { error: "Supplier not found" },
      { status: 403 }
    )
  }

  // 🔐 Ensure correct role
  if (supplier.role !== "SUPPLIER") {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    )
  }

  const orders = await Order.find({

    status: "pending",

    $or: [
      { requestType: "global" },
      { supplierUID: supplierUID }
    ]

  }).sort({ createdAt: -1 })

  return NextResponse.json({
    success: true,
    orders
  })

}