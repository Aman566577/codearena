import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  myAssessments,
  startAssessment,
  getAttempt,
  saveDraft,
  getDrafts,
} from "../controllers/candidateController.js";

const router = Router();

router.use(requireAuth, requireRole("candidate"));

router.get("/assessments", myAssessments);
router.post("/assessments/:id/start", startAssessment);
router.get("/attempts/:attemptId", getAttempt);
router.put("/attempts/:attemptId/draft", saveDraft);
router.get("/attempts/:attemptId/drafts", getDrafts);

export default router;