import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import Supplier from "@/models/Supplier"
import { authenticateUserRequest } from "@/lib/user-auth"

type MinimalSupplier = {
  firebaseUID: string
  name?: string
  email?: string
  phone?: string
  rollNo?: string
  branch?: string
  year?: string
  photoURL?: string
  firebasePhotoURL?: string
}

const ORDER_SELECT_FIELDS = [
  "userUID",
  "supplierUID",
  "status",
  "paymentStatus",
  "printType",
  "pages",
  "verifiedPages",
  "estimatedPrice",
  "finalPrice",
  "fileURL",
  "duplex",
  "instruction",
  "alternatePhone",
  "requestType",
  "createdAt",
  "acceptedAt",
  "paidAt",
  "deliveredAt"
].join(" ")

export async function GET(req: Request) {

  try {
    const auth = await authenticateUserRequest(req, {
      requireProfile: false,
      requireActive: false
    })
    if (!auth.ok) return auth.response

    await connectDB()

    const { searchParams } = new URL(req.url)
    const firebaseUID = searchParams.get("firebaseUID")

    if (!firebaseUID) {
      return NextResponse.json({
        success: false,
        message: "Missing firebaseUID"
      }, { status: 400 })
    }

    if (firebaseUID !== auth.uid) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized UID"
      }, { status: 403 })
    }

    const normalizeTime = new Date()
    await Order.updateMany(
      {
        userUID: firebaseUID,
        paymentStatus: "paid",
        status: { $in: ["awaiting_payment", "accepted"] }
      },
      {
        $set: { status: "printing" },
        $push: {
          logs: {
            message: "Auto-moved to printing because payment is completed",
            time: normalizeTime
          }
        }
      }
    )

    const orders = await Order.find({
      userUID: firebaseUID
    })
      .select(ORDER_SELECT_FIELDS)
      .sort({ createdAt: -1 })
      .lean()

    const supplierUIDs = [
      ...new Set(
        orders
          .map((order) => String(order.supplierUID || ""))
          .filter(Boolean)
      )
    ]

    const suppliers = (await Supplier.find({
      firebaseUID: { $in: supplierUIDs }
    })
      .select("firebaseUID name email phone rollNo branch year photoURL firebasePhotoURL")
      .lean()) as MinimalSupplier[]

    const supplierMap = new Map<string, MinimalSupplier>()
    suppliers.forEach((supplier) => {
      supplierMap.set(String(supplier.firebaseUID), supplier)
    })

    const enrichedOrders = orders.map((order) => {
      const supplier = supplierMap.get(String(order.supplierUID || ""))

      const supplierProfile = supplier
        ? {
            name: supplier.name || "",
            email: supplier.email || "",
            phone: supplier.phone || "",
            rollNo: supplier.rollNo || "",
            branch: supplier.branch || "",
            year: supplier.year || "",
            photoURL: supplier.photoURL || "",
            firebasePhotoURL: supplier.firebasePhotoURL || "",
            displayPhotoURL: supplier.photoURL || supplier.firebasePhotoURL || ""
          }
        : null

      return {
        ...order,
        supplierName: supplier?.name || null,
        supplierProfile
      }
    })

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
