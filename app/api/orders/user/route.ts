import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import Supplier from "@/models/Supplier"

export async function GET(req: Request) {

  try {

    await connectDB()

    const { searchParams } = new URL(req.url)
    const firebaseUID = searchParams.get("firebaseUID")

    if (!firebaseUID) {
      return NextResponse.json({
        success: false,
        message: "Missing firebaseUID"
      })
    }

    const orders = await Order.find({
      userUID: firebaseUID
    }).sort({ createdAt: -1 })

    const enrichedOrders = await Promise.all(

      orders.map(async (order) => {

        let supplierName = null

        if (order.supplierUID) {

          const supplier = await Supplier.findOne({
            firebaseUID: order.supplierUID
          })

          supplierName = supplier?.name || null

        }

        return {
          ...order.toObject(),
          supplierName
        }

      })

    )

    return NextResponse.json({
      success: true,
      orders: enrichedOrders
    })

  } catch (error) {

    console.log("FETCH USER ORDERS ERROR:", error)

    return NextResponse.json({
      success: false,
      message: "Failed to fetch orders"
    })

  }

}