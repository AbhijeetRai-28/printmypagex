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
await User.findOneAndUpdate(
{ firebaseUID: body.firebaseUID },
{
firebaseUID: body.firebaseUID,
email: body.email || undefined,
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

console.log("SUPPLIER_PROFILE_DEBUG: Existing supplier, user profile synced", {
firebaseUID: body.firebaseUID,
hasEmail: Boolean(body.email)
})

return NextResponse.json({
error: "Already applied"
})
}

const supplier = await Supplier.create({

firebaseUID: body.firebaseUID,
name: body.name,
email: body.email || undefined,
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
email: body.email || undefined,
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

console.log("SUPPLIER_PROFILE_DEBUG: Supplier application synced", {
firebaseUID: body.firebaseUID,
hasEmail: Boolean(body.email)
})

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
