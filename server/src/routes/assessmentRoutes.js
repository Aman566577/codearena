import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createAssessment,
  listAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
} from "../controllers/assessmentController.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.post("/", createAssessment);
router.get("/", listAssessments);
router.get("/:id", getAssessment);
router.put("/:id", updateAssessment);
router.delete("/:id", deleteAssessment);

export default router;