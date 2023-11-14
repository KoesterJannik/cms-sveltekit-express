import { config } from "dotenv";
config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function hashPassword(plainTextPassword: string) {
  const saltRounds = Number(process.env.SALT_ROUNDS);
  if (!saltRounds) throw new Error("SALT_ROUNDS is not defined");
  const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
  return hashedPassword;
}

export async function verifyPassword(
  plainTextPassword: string,
  hashedPassword: string
) {
  const isPasswordCorrect = await bcrypt.compare(
    plainTextPassword,
    hashedPassword
  );
  return isPasswordCorrect;
}

export async function generateJwt(userId: number) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  const DURATION_IN_DAYS = process.env.JWT_DURATION_IN_DAYS;
  if (!DURATION_IN_DAYS) throw new Error("JWT_DURATION_IN_DAYS is not defined");
  const token = jwt.sign({ userId }, secret, {
    expiresIn: DURATION_IN_DAYS + "d",
  });
  return token;
}

export async function verifyJwt(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  const decoded = jwt.verify(token, secret);
  return decoded;
}
