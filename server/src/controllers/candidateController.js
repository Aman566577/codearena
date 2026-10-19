import Assessment from "../models/Assessment.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import Question from "../models/Question.js";

// Candidate: list my assigned assessments with status
export async function myAssessments(req, res) {
  const assessments = await Assessment.find({
    assignedCandidates: req.user._id,
  })
    .select("title description duration startAt endAt")
    .sort({ startAt: -1 });

  const attempts = await AssessmentAttempt.find({
    candidateId: req.user._id,
    assessmentId: { $in: assessments.map((a) => a._id) },
  });
  const byAssessment = new Map(attempts.map((t) => [String(t.assessmentId), t]));

  const now = new Date();
  const result = assessments.map((a) => {
    const attempt = byAssessment.get(String(a._id));
    let status = "not_started";
    if (attempt) status = attempt.status;
    else if (now < a.startAt) status = "upcoming";
    else if (now > a.endAt) status = "missed";
    return { ...a.toObject(), status, attemptId: attempt?._id ?? null };
  });

  res.json({ assessments: result });
}

// Candidate: start an attempt
export async function startAssessment(req, res) {
  const assessment = await Assessment.findOne({
    _id: req.params.id,
    assignedCandidates: req.user._id,
  });
  if (!assessment) {
    return res.status(404).json({ message: "Assessment not found" });
  }

  const now = new Date();
  if (now < assessment.startAt) {
    return res.status(403).json({ message: "Assessment has not started yet" });
  }
  if (now > assessment.endAt) {
    return res.status(403).json({ message: "Assessment has ended" });
  }

  const existing = await AssessmentAttempt.findOne({
    assessmentId: assessment._id,
    candidateId: req.user._id,
  });
  if (existing) {
    return res.status(409).json({ message: "Attempt already started", attempt: existing });
  }

  const byDuration = new Date(now.getTime() + assessment.duration * 60 * 1000);
  const deadline = byDuration < assessment.endAt ? byDuration : assessment.endAt;

  let attempt;
  try {
    attempt = await AssessmentAttempt.create({
      assessmentId: assessment._id,
      candidateId: req.user._id,
      startedAt: now,
      deadline,
    });
  } catch (err) {
    // two simultaneous requests: the unique index rejects the second one
    if (err.code === 11000) {
      return res.status(409).json({ message: "Attempt already started" });
    }
    throw err;
  }

  res.status(201).json({ attempt });
}

// Candidate: get the questions of my attempt (NO hidden test cases)
export async function getAttempt(req, res) {
  const attempt = await AssessmentAttempt.findOne({
    _id: req.params.attemptId,
    candidateId: req.user._id,
  });
  if (!attempt) return res.status(404).json({ message: "Attempt not found" });

  const assessment = await Assessment.findById(attempt.assessmentId);
  // hiddenTestCases has select:false, so it is not loaded here
  const questions = await Question.find({ _id: { $in: assessment.questionIds } }).select(
    "title description difficulty constraints sampleCases marks"
  );

  res.json({
    attempt,
    serverTime: new Date(),
    assessment: { title: assessment.title, duration: assessment.duration },
    questions,
  });
}