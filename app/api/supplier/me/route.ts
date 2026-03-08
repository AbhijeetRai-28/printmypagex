import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Supplier from "@/models/Supplier"
import User from "@/models/User"
import { isOwnerEmail } from "@/lib/owner-access"

export async function GET(req:Request){

await connectDB()

const {searchParams} = new URL(req.url)

const firebaseUID = searchParams.get("firebaseUID")

const supplier = await Supplier.findOne({
firebaseUID
})

if (!supplier && firebaseUID) {
const user = await User.findOne({ firebaseUID }).select("email name phone rollNo branch year photoURL firebasePhotoURL")

if (user && isOwnerEmail(user.email)) {
return NextResponse.json({
success: true,
supplier: {
firebaseUID,
name: user.name || "Owner",
email: user.email || "",
phone: user.phone || "",
rollNo: user.rollNo || "",
branch: user.branch || "",
year: user.year || "",
photoURL: user.photoURL || "",
firebasePhotoURL: user.firebasePhotoURL || "",
displayPhotoURL: user.photoURL || user.firebasePhotoURL || "",
approved: true,
active: true
}
})
}
}

const supplierObj = supplier?.toObject()

return NextResponse.json({
success:true,
supplier: supplierObj
? {
...supplierObj,
displayPhotoURL: supplierObj.photoURL || supplierObj.firebasePhotoURL || ""
}
: null
})

}
