import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "../../domain/enums.js";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { ConflictError, UnauthorizedError, ValidationError } from "../../utils/errors.js";

const SALT_ROUNDS = 12;

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  profile_image_url: string | null;
  role: Role;
  total_xp: number;
};

export function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  username: string;
  profileImageUrl: string | null;
  role: Role;
  totalXp: number;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    profile_image_url: user.profileImageUrl,
    role: user.role,
    total_xp: user.totalXp,
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const email = input.email.toLowerCase().trim();
  const username = input.username.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new ConflictError("Email or username already taken");
  }
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      name: input.name.trim(),
      passwordHash,
    },
  });
  const tokens = await issueTokens(user.id, user.role);
  return { user: toPublicUser(user), tokens };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError("Invalid credentials");
  }
  const tokens = await issueTokens(user.id, user.role);
  return { user: toPublicUser(user), tokens };
}

export async function refreshSession(refreshToken: string): Promise<AuthTokens> {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid refresh token");
  }
  try {
    jwt.verify(refreshToken, env().JWT_REFRESH_SECRET);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  return issueTokens(stored.user.id, stored.user.role);
}

export async function logoutUser(refreshToken: string): Promise<void> {
  if (!refreshToken) {
    throw new ValidationError("refresh_token is required");
  }
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function issueTokens(userId: string, role: Role): Promise<AuthTokens> {
  const config = env();
  const access_token = jwt.sign({ sub: userId, role }, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES as jwt.SignOptions["expiresIn"],
  });
  const refresh_token = jwt.sign({ sub: userId, typ: "refresh" }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES as jwt.SignOptions["expiresIn"],
  });
  const decoded = jwt.decode(refresh_token);
  const exp =
    decoded && typeof decoded === "object" && typeof decoded.exp === "number"
      ? decoded.exp * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000;
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refresh_token),
      expiresAt: new Date(exp),
    },
  });
  return {
    access_token,
    refresh_token,
    token_type: "Bearer",
    expires_in: config.JWT_ACCESS_EXPIRES,
  };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
