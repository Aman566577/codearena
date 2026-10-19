import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createQuestion,
  listQuestions,
  getQuestionAdmin,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.post("/", createQuestion);
router.get("/", listQuestions);
router.get("/:id", getQuestionAdmin);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

export default router;