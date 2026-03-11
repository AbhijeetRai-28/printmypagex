import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { pusherServer } from "@/lib/pusher-server"
import { sendOrderCancelledNotification } from "@/lib/order-email"
import { authenticateSupplierRequest } from "@/lib/supplier-auth"

export const runtime = "nodejs"

export async function POST(req: Request){
const auth = await authenticateSupplierRequest(req)
if (!auth.ok) return auth.response

await connectDB()

const body = await req.json()

const { orderId } = body
const supplierUIDFromBody = body.supplierUID as string | undefined
const supplierUID = auth.uid

if(!orderId){
return NextResponse.json(
{
success:false,
message:"Missing order details"
},
{ status:400 }
)
}

if(supplierUIDFromBody && supplierUIDFromBody !== supplierUID){
return NextResponse.json(
{
success:false,
message:"Unauthorized supplier"
},
{ status:403 }
)
}

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
`private-user-${order.userUID}`,
"order-updated",
order
)

sendOrderCancelledNotification(order, "supplier").catch((emailError) => {
console.error("ORDER_CANCELLED_EMAIL_ERROR:", emailError)
})

return NextResponse.json({
success:true,
order
})

}
