import mongoose from "mongoose"

const OrderSchema = new mongoose.Schema({

  userUID:{
    type:String,
    required:true
  },

  supplierUID:{
    type:String,
    default:null
  },

  requestType:{
    type:String,
    enum:["global","specific"],
    default:"global"
  },

  alternatePhone:{
    type:String,
    default:""
  },

  duplex:{
    type:Boolean,
    default:false
  },

  instruction:{
    type:String,
    default:""
  },

  fileURL:{
    type:String,
    required:true
  },

  pages:{
    type:Number,
    required:true
  },

  verifiedPages:{
    type:Number,
    default:null
  },

  printType:{
    type:String,
    enum:["bw","color","glossy"],
    required:true
  },

  estimatedPrice:{
    type:Number,
    required:true
  },

  finalPrice:{
    type:Number,
    default:null
  },

  paymentStatus:{
    type:String,
    enum:["unpaid","paid"],
    default:"unpaid"
  },

  razorpayOrderId:{
    type:String,
    default:null
  },

  razorpayPaymentId:{
    type:String,
    default:null
  },

  razorpaySignature:{
    type:String,
    default:null
  },

  paidAt:{
    type:Date,
    default:null
  },

  status:{
    type:String,
    enum:[
      "pending",
      "accepted",
      "awaiting_payment",
      "printing",
      "printed",
      "delivered",
      "cancelled"
    ],
    default:"pending"
  },

  acceptedAt:{
    type:Date,
    default:null
  },

  deliveredAt:{
    type:Date,
    default:null
  },

  cancelledAt:{
    type:Date,
    default:null
  },

  logs:[
    {
      message:String,
      time:{
        type:Date,
        default:Date.now
      }
    }
  ],

  createdAt:{
    type:Date,
    default:Date.now
  }

})

export default mongoose.models.Order ||
mongoose.model("Order",OrderSchema)
