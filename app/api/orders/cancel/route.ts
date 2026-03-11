import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { sendOrderCancelledNotification } from "@/lib/order-email"
import { authenticateUserRequest } from "@/lib/user-auth"

export const runtime = "nodejs"

export async function POST(req:Request){
const auth = await authenticateUserRequest(req)
if (!auth.ok) return auth.response

await connectDB()

const body = await req.json()

if(!body?.orderId){
return NextResponse.json(
{
success:false,
message:"Missing orderId"
},
{ status:400 }
)
}

const order = await Order.findById(body.orderId)

if(!order){
return NextResponse.json({success:false},{ status:404 })
}

if(order.userUID !== auth.uid){
return NextResponse.json(
{
success:false,
message:"Unauthorized cancellation request"
},
{ status:403 }
)
}

if(order.paymentStatus==="paid"){
return NextResponse.json({
success:false,
message:"Paid orders cannot be cancelled"
})
}

order.status="cancelled"
order.cancelledAt=new Date()

order.logs.push({
message:"Order cancelled by user",
time:new Date()
})

await order.save()

sendOrderCancelledNotification(order, "user").catch((emailError) => {
console.error("ORDER_CANCELLED_EMAIL_ERROR:", emailError)
})

return NextResponse.json({
success:true
})

}
