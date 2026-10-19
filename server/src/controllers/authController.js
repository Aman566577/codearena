import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
};

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
  }
  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  res.cookie("token", signToken(user), cookieOptions);
  res.status(201).json({ user: publicUser(user) });
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.cookie("token", signToken(user), cookieOptions);
  res.json({ user: publicUser(user) });
}

export function logout(req, res) {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ message: "Logged out" });
}

export function me(req, res) {
  res.json({ user: publicUser(req.user) });
}