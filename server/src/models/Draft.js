import mongoose from "mongoose";

const draftSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAttempt",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    language: { type: String, enum: ["python", "java"], required: true },
    sourceCode: { type: String, default: "", maxlength: 50000 },
  },
  { timestamps: true }
);

draftSchema.index(
  { attemptId: 1, questionId: 1, language: 1 },
  { unique: true }
);

export default mongoose.model("Draft", draftSchema);