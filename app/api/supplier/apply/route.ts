import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Supplier from "@/models/Supplier"
import User from "@/models/User"

export async function POST(req: Request){

try{

await connectDB()

const body = await req.json()

const existing = await Supplier.findOne({
firebaseUID: body.firebaseUID
})

if(existing){
return NextResponse.json({
error: "Already applied"
})
}

const supplier = await Supplier.create({

firebaseUID: body.firebaseUID,
name: body.name,
phone: body.phone,
rollNo: body.rollNo,
branch: body.branch,
year: body.year,

approved: false,
active: false

})

/* 🔥 CRITICAL FIX */
await User.findOneAndUpdate(

{ firebaseUID: body.firebaseUID },

{
firebaseUID: body.firebaseUID,
name: body.name,
phone: body.phone,
rollNo: body.rollNo,
branch: body.branch,
year: body.year,
role: "SUPPLIER"
},

{
upsert: true,
new: true
}

)

return NextResponse.json({
success: true,
supplier
})

}catch(err){

console.log(err)

return NextResponse.json({
error: "Server error"
})

}

}