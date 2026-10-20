import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";

const app = express();

app.use(helmet());
app.use(
  cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/candidate", candidateRoutes);

export default app;