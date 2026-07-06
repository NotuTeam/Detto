"use server";

import { authRepository } from "../repositories";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "../schemas";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "detto_session";

export async function registerUser(input: RegisterInput) {
  const parsed = registerSchema.parse(input);

  const existing = await authRepository.findUserByUsername(parsed.username);
  if (existing) {
    return { success: false, error: { code: "USERNAME_EXISTS", message: "Username is already taken" } };
  }

  const { user, session } = await authRepository.createUser(parsed);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return {
    success: true,
    data: { id: user.id, username: user.username, displayName: user.displayName },
  };
}

export async function loginUser(input: LoginInput) {
  const parsed = loginSchema.parse(input);

  const user = await authRepository.verifyUser(parsed.username, parsed.password);
  if (!user) {
    return { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" } };
  }

  const relationship = await prisma.relationship.findFirst({
    where: {
      OR: [{ partnerAId: user.id }, { partnerBId: user.id }],
      deletedAt: null,
      status: { in: ["WAITING_PARTNER", "ACTIVE"] },
    },
  });

  const session = await authRepository.createSession(user.id, relationship?.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return {
    success: true,
    data: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      relationshipId: relationship?.id || null,
    },
  };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await authRepository.deleteSession(token);
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await authRepository.getSession(token);
  if (!session || session.expiresAt < new Date()) return null;

  return session;
}
