import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import User from "@/models/User"

export async function GET(req: Request){

await connectDB()

const { searchParams } = new URL(req.url)
const supplierUID = searchParams.get("supplierUID")

if(!supplierUID){
return NextResponse.json({success:false})
}

const orders = await Order.find({
supplierUID
}).sort({createdAt:-1})

const enrichedOrders = await Promise.all(

orders.map(async(order)=>{

const user = await User.findOne({
firebaseUID:order.userUID
})

return{
...order.toObject(),
userName:user?.name || "",
class:user?.section || "",
rollNo:user?.rollNo || "",
phone:user?.phone || "",
userProfile:{
name:user?.name || "",
email:user?.email || "",
phone:user?.phone || "",
rollNo:user?.rollNo || "",
branch:user?.branch || "",
year:user?.year || "",
section:user?.section || "",
photoURL:user?.photoURL || "",
firebasePhotoURL:user?.firebasePhotoURL || "",
displayPhotoURL:(user?.photoURL || user?.firebasePhotoURL || "")
}
}

})

)

return NextResponse.json({
success:true,
orders:enrichedOrders
})

}
