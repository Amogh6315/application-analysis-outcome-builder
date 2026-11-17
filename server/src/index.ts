import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./auth";

dotenv.config({ path: "server/.env" });

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: "10kb" }));

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);

app.use("/api/auth", authRouter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Outcome Builder API is running",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Outcome Builder API running on port ${PORT}`);
});