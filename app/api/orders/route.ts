import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { pusherServer } from "@/lib/pusher-server"

export async function POST(req: Request){
  try {
    await connectDB()

    const body = await req.json()
    const orderId = body.orderId as string | undefined
    const supplierUID = body.supplierUID as string | undefined
    const pagesValue = body.verifiedPages ?? body.pages
    const verifiedPages = Number(pagesValue)

    if(!orderId || !supplierUID){
      return NextResponse.json(
        {
          success:false,
          message:"Missing order or supplier details"
        },
        { status:400 }
      )
    }

    if(!Number.isFinite(verifiedPages) || verifiedPages<=0){
      return NextResponse.json(
        {
          success:false,
          message:"Verified pages must be greater than 0"
        },
        { status:400 }
      )
    }

    const order = await Order.findById(orderId)

    if(!order){
      return NextResponse.json(
        {
          success:false,
          message:"Order not found"
        },
        { status:404 }
      )
    }

    if(order.status === "cancelled"){
      return NextResponse.json(
        {
          success:false,
          message:"Cancelled orders cannot be verified"
        },
        { status:409 }
      )
    }

    if(order.supplierUID && order.supplierUID !== supplierUID){
      return NextResponse.json(
        {
          success:false,
          message:"You are not allowed to verify this order"
        },
        { status:403 }
      )
    }

    if(order.paymentStatus === "paid"){
      return NextResponse.json(
        {
          success:false,
          message:"Payment already completed for this order"
        },
        { status:409 }
      )
    }

    let pricePerPage = 2

    if(order.printType === "color") pricePerPage = 5
    if(order.printType === "glossy") pricePerPage = 15

    const finalPrice = verifiedPages * pricePerPage

    if(!order.supplierUID){
      order.supplierUID = supplierUID
      order.acceptedAt = new Date()
      order.logs.push({
        message:"Order accepted by supplier during verification",
        time:new Date()
      })
    }

    order.verifiedPages = verifiedPages
    order.finalPrice = finalPrice
    order.status = "awaiting_payment"

    order.logs.push({
      message:`Supplier verified ${verifiedPages} pages`,
      time:new Date()
    })

    await order.save()

    try {
      await pusherServer.trigger(
        `user-${order.userUID}`,
        "order-updated",
        order
      )
    } catch (pushError) {
      console.error("PUSHER NOTIFICATION ERROR:", pushError)
    }

    return NextResponse.json({
      success:true,
      order
    })
  } catch (error) {
    console.error("VERIFY ORDER (LEGACY ROUTE) ERROR:", error)
    return NextResponse.json(
      {
        success:false,
        message:"Failed to verify pages"
      },
      { status:500 }
    )
  }

}
