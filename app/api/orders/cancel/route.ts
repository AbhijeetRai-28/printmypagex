import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"

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

return NextResponse.json({
success:true
})

}