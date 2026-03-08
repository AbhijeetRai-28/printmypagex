import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { sendOrderCancelledNotification } from "@/lib/order-email"

export const runtime = "nodejs"

export async function POST(req:Request){

await connectDB()

const body = await req.json()

const order = await Order.findById(body.orderId)

if(!order){
return NextResponse.json({success:false})
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
