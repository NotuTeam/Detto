import { prisma } from "@/lib/prisma";
import { hash, verify } from "argon2";
import { randomUUID } from "crypto";

export const authRepository = {
  async findUserByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },

  async hashPassword(password: string) {
    return hash(password);
  },

  async createUser(data: {
    username: string;
    displayName: string;
    password: string;
    birthDate: string;
    avatarUrl?: string | null;
  }) {
    const passwordHash = await hash(data.password);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        passwordHash,
        birthDate: new Date(data.birthDate),
        avatarUrl: data.avatarUrl || null,
      },
    });

    const token = randomUUID();
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return { user, session };
  },

  async verifyUser(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return null;

    const valid = await verify(user.passwordHash, password);
    if (!valid) return null;

    return user;
  },

  async createSession(userId: string, relationshipId?: string | null) {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        relationshipId: relationshipId || null,
      },
    });
  },

  async getSession(token: string) {
    return prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
        relationship: true,
      },
    });
  },

  async deleteSession(token: string) {
    return prisma.session.delete({ where: { token } });
  },

  async touchSession(token: string) {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);
    return prisma.session.update({
      where: { token },
      data: { expiresAt: newExpiry },
    });
  },
};
