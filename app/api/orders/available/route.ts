import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import Supplier from "@/models/Supplier"
import User from "@/models/User"
import { isOwnerEmail } from "@/lib/owner-access"

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

  const supplier = await Supplier.findOne({
    firebaseUID: supplierUID
  })

  const user = await User.findOne({ firebaseUID: supplierUID }).select("email")
  const ownerAccess = isOwnerEmail(user?.email)

  if (!supplier && !ownerAccess) {
    return NextResponse.json({ error: "Supplier not registered" }, { status: 403 })
  }

  if (!ownerAccess && !supplier?.approved) {
    return NextResponse.json({ error: "Supplier not approved" }, { status: 403 })
  }

  if (!ownerAccess && !supplier?.active) {
    return NextResponse.json({ error: "Supplier inactive" }, { status: 403 })
  }

  const orders = await Order.find({

    status: "pending",

    $or: [

      {
        requestType: "global",
        supplierUID: null
      },

      {
        requestType: "specific",
        supplierUID: supplierUID
      }

    ]

  }).sort({ createdAt: -1 })

  const enrichedOrders = await Promise.all(

    orders.map(async (order) => {

      const user = await User.findOne({
        firebaseUID: order.userUID
      })

      return {
        ...order.toObject(),
        userName: user?.name || "",
        class: user?.section || "",
        rollNo: user?.rollNo || "",
        phone: user?.phone || "",
        userProfile: {
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          rollNo: user?.rollNo || "",
          branch: user?.branch || "",
          year: user?.year || "",
          section: user?.section || "",
          photoURL: user?.photoURL || "",
          firebasePhotoURL: user?.firebasePhotoURL || "",
          displayPhotoURL: (user?.photoURL || user?.firebasePhotoURL || "")
        }
      }

    })

  )

  return NextResponse.json({
    success: true,
    orders: enrichedOrders
  })

}
