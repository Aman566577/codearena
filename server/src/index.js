import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected");

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);