import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected");

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);