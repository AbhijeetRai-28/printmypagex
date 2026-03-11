import mongoose from "mongoose"

const SupplierSchema = new mongoose.Schema({

firebaseUID:{
type:String,
required:true,
unique:true
},

name:String,
email:String,
photoURL:String,
firebasePhotoURL:String,
phone:String,
rollNo:String,
branch:String,
year:String,

approved:{
type:Boolean,
default:false
},

active:{
type:Boolean,
default:false
},

createdAt:{
type:Date,
default:Date.now
}

})

SupplierSchema.index({ approved: 1, active: 1, createdAt: -1 })
SupplierSchema.index({ active: 1, createdAt: -1 })

export default mongoose.models.Supplier ||
mongoose.model("Supplier",SupplierSchema)
