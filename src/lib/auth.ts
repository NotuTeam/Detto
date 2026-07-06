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

  return session;
}

export { SESSION_COOKIE };
