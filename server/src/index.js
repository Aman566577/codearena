import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";

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

await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected");

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);