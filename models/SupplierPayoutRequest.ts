import mongoose from "mongoose"

const SupplierPayoutRequestSchema = new mongoose.Schema({
  supplierUID: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  note: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  processedBy: {
    type: String,
    default: null
  }
})

export default mongoose.models.SupplierPayoutRequest ||
  mongoose.model("SupplierPayoutRequest", SupplierPayoutRequestSchema)
