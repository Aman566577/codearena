import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    questionIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    ],
    duration: { type: Number, required: true, min: 1 }, // minutes
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    assignedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

assessmentSchema.index({ assignedCandidates: 1 });

export default mongoose.model("Assessment", assessmentSchema);