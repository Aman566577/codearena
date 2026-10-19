import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: { type: Date, required: true },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired"],
      default: "in_progress",
    },
  },
  { timestamps: true }
);

// one attempt per candidate per assessment (enforced by the database)
attemptSchema.index({ assessmentId: 1, candidateId: 1 }, { unique: true });

export default mongoose.model("AssessmentAttempt", attemptSchema);