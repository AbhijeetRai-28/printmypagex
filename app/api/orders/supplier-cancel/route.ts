import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { pusherServer } from "@/lib/pusher-server"

export async function POST(req: Request){

await connectDB()

const body = await req.json()

const { orderId, supplierUID } = body

const order = await Order.findOne({
  _id: orderId
})

if(!order){
return NextResponse.json({success:false})
}

/* only supplier who owns order can cancel */

if(order.supplierUID !== supplierUID){
return NextResponse.json({success:false})
}

/* cannot cancel paid order */

if(order.paymentStatus === "paid"){
return NextResponse.json({
success:false,
message:"Cannot cancel paid order"
})
}

order.status = "cancelled"
order.cancelledAt = new Date()

order.logs.push({
message:"Order cancelled by supplier",
time:new Date()
})

await order.save()

/* realtime update for user */

await pusherServer.trigger(
`user-${order.userUID}`,
"order-updated",
order
)

return NextResponse.json({
success:true,
order
})

}