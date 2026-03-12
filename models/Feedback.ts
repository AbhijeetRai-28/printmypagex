import mongoose from "mongoose"

const ratingField = {
  type: Number,
  required: true,
  min: 1,
  max: 5
}

const FeedbackSchema = new mongoose.Schema({
  uiRating: ratingField,
  easeOfUseRating: ratingField,
  workflowRating: ratingField,
  effectivenessRating: ratingField,
  performanceRating: ratingField,
  stabilityRating: ratingField,

  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1500
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

FeedbackSchema.index({ createdAt: -1 })
FeedbackSchema.index({ overallRating: -1 })

export default mongoose.models.Feedback ||
mongoose.model("Feedback", FeedbackSchema)
