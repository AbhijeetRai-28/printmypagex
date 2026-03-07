import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { pusherServer } from "@/lib/pusher-server"

export async function POST(req:Request){
try{

await connectDB()

const body = await req.json()
const { orderId, status, supplierUID } = body

if(!orderId || !status || !supplierUID){
return NextResponse.json(
{
success:false,
message:"Missing update details"
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

if(order.supplierUID !== supplierUID){
return NextResponse.json(
{
success:false,
message:"You are not allowed to update this order"
},
{ status:403 }
)
}

const allowedNext: Record<string, string[]> = {
awaiting_payment:["printing"],
printing:["printed"],
printed:["delivered"]
}

const nextStates = allowedNext[order.status] || []
if(!nextStates.includes(status)){
return NextResponse.json(
{
success:false,
message:`Cannot move order from ${order.status} to ${status}`
},
{ status:409 }
)
}

if(status === "printing" && order.paymentStatus !== "paid"){
return NextResponse.json(
{
success:false,
message:"Order must be paid before printing starts"
},
{ status:409 }
)
}

order.status = status

if(status === "delivered"){
order.deliveredAt = new Date()
}

order.logs.push({
message:`Supplier updated status to ${status}`,
time:new Date()
})

await order.save()

try{
await pusherServer.trigger(`user-${order.userUID}`,"order-updated",order)
}catch(pushError){
console.error("PUSHER USER STATUS UPDATE ERROR:",pushError)
}

try{
if(order.supplierUID){
await pusherServer.trigger(`supplier-${order.supplierUID}`,"order-updated",order)
}
}catch(pushError){
console.error("PUSHER SUPPLIER STATUS UPDATE ERROR:",pushError)
}

return NextResponse.json({
success:true,
order
})
}catch(error){
console.error("ORDER STATUS UPDATE ERROR:",error)
return NextResponse.json(
{
success:false,
message:"Failed to update order status"
},
{ status:500 }
)
}

}
