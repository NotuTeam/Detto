import { prisma } from "./prisma";
import { hash, verify } from "argon2";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "detto_session";

export async function hashPassword(password: string) {
  return hash(password);
}

export async function verifyPassword(password: string, hashStr: string) {
  return verify(hashStr, password);
}

export function generateToken() {
  return randomUUID();
}

export async function getSessionFromDb() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: true,
      relationship: true,
    },
  });

  if (!session || session.expiresAt < new Date()) return null;

  // Auto-renew: extend DB + cookie if more than halfway expired (3.5 days in)
  const totalTtl = 7 * 24 * 60 * 60 * 1000;
  const remaining = session.expiresAt.getTime() - Date.now();
  if (remaining < totalTtl / 2) {
    const newExpiry = new Date(Date.now() + totalTtl);
    await prisma.session.update({
      where: { token },
      data: { expiresAt: newExpiry },
    });
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return session;
}

export { SESSION_COOKIE };
