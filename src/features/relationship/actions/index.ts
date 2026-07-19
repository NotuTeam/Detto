"use server";

import { createRelationshipSchema, joinRelationshipSchema, type CreateRelationshipInput, type JoinRelationshipInput } from "../schemas";
import { getSession } from "@/features/auth/actions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { INVITATION_EXPIRY_DAYS } from "@/config/constants";
import { generateShortCode } from "@/lib/utils";
import { generateAutoEventsForRelationship, updateAutoEventDateForYear } from "@/lib/auto-events";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";
import { deleteFromCloudinaryByUrl, generateSignature } from "@/lib/cloudinary";

const BANNER_FOLDER = "detto/relationship-banners";

export async function createRelationship(input: CreateRelationshipInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED", message: "Please login first" } };

    const parsed = createRelationshipSchema.parse(input);

    const existing = await prisma.relationship.findFirst({
      where: {
        OR: [{ partnerAId: session.user.id }, { partnerBId: session.user.id }],
        deletedAt: null,
        status: { in: ["WAITING_PARTNER", "ACTIVE"] },
      },
    });

    if (existing) return { success: false, error: { code: "ALREADY_IN_RELATIONSHIP", message: "You already have an active relationship" } };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
    const invitationToken = randomUUID();
    const shortCode = generateShortCode();

    const relationship = await prisma.$transaction(async (tx) => {
      const rel = await tx.relationship.create({
        data: {
          name: parsed.name || null,
          partnerAId: session.user.id,
          startedAt: new Date(parsed.startedAt),
        },
      });

      await tx.invitation.create({
        data: {
          relationshipId: rel.id,
          token: invitationToken,
          shortCode,
          expiredAt: expiresAt,
        },
      });

      return rel;
    });

    const cookieStore = await cookies();
    const token = cookieStore.get("detto_session")?.value;
    if (token) {
      await prisma.session.update({ where: { token }, data: { relationshipId: relationship.id } });
    }

    return {
      success: true,
      data: { relationshipId: relationship.id, invitationToken, shortCode },
    };
  } catch (err) {
    console.error("createRelationship error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create relationship" } };
  }
}

export async function joinRelationship(input: JoinRelationshipInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED", message: "Please login first" } };

    const parsed = joinRelationshipSchema.parse(input);
    const code = parsed.shortCode.toUpperCase();

    const invitation = await prisma.invitation.findUnique({ where: { shortCode: code } });
    if (!invitation) return { success: false, error: { code: "INVITATION_INVALID", message: "Invalid invitation code" } };
    if (invitation.status !== "PENDING") return { success: false, error: { code: "INVITATION_INVALID", message: "Invitation is no longer active" } };
    if (invitation.expiredAt < new Date()) return { success: false, error: { code: "INVITATION_EXPIRED", message: "Invitation has expired" } };

    const relationship = await prisma.relationship.findUnique({ where: { id: invitation.relationshipId } });
    if (!relationship) return { success: false, error: { code: "RELATIONSHIP_NOT_FOUND", message: "Relationship not found" } };
    if (relationship.partnerAId === session.user.id) return { success: false, error: { code: "SELF_JOIN", message: "You can't join your own invitation" } };
    if (relationship.partnerBId) return { success: false, error: { code: "WORKSPACE_FULL", message: "Workspace is full" } };

    const existingRel = await prisma.relationship.findFirst({
      where: {
        OR: [{ partnerAId: session.user.id }, { partnerBId: session.user.id }],
        deletedAt: null,
        status: { in: ["WAITING_PARTNER", "ACTIVE"] },
        id: { not: relationship.id },
      },
    });
    if (existingRel) return { success: false, error: { code: "ALREADY_IN_RELATIONSHIP", message: "You already have an active relationship" } };

    await prisma.$transaction(async (tx) => {
      await tx.relationship.update({
        where: { id: relationship.id },
        data: { partnerBId: session.user.id, status: "ACTIVE" },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });
    });

    const cookieStore = await cookies();
    const token = cookieStore.get("detto_session")?.value;
    if (token) {
      await prisma.session.update({ where: { token }, data: { relationshipId: relationship.id } });
    }

    // Generate auto events (birthdays + anniversary)
    await generateAutoEventsForRelationship(relationship.id);

    // Notify partnerA that someone joined their relationship
    const joiner = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { displayName: true },
    });

    await prisma.notification.create({
      data: {
        userId: relationship.partnerAId,
        type: "PARTNER_JOINED",
        title: "Your partner joined!",
        message: `${joiner?.displayName || "Your partner"} accepted your invitation`,
      },
    });

    sendPushNotification(relationship.partnerAId, {
      title: "Your partner joined!",
      body: `${joiner?.displayName || "Your partner"} accepted your invitation`,
      url: "/relation",
    }).catch(() => {});

    revalidatePath("/notifications");

    return { success: true, data: { relationshipId: relationship.id } };
  } catch (err) {
    console.error("joinRelationship error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to join relationship" } };
  }
}

export async function joinByShortCode(shortCode: string) {
  return joinRelationship({ shortCode });
}

export async function validateInvitationByCode(shortCode: string) {
  const code = shortCode.toUpperCase();
  const invitation = await prisma.invitation.findUnique({
    where: { shortCode: code },
    include: {
      relationship: {
        include: {
          partnerA: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!invitation) return { success: false, error: { code: "INVITATION_INVALID", message: "Invalid invitation code" } };
  if (invitation.status !== "PENDING") return { success: false, error: { code: "INVITATION_INVALID", message: "Invitation is no longer active" } };
  if (invitation.expiredAt < new Date()) return { success: false, error: { code: "INVITATION_EXPIRED", message: "Invitation has expired" } };

  return {
    success: true,
    data: {
      inviterName: invitation.relationship.partnerA.displayName,
      relationshipId: invitation.relationshipId,
    },
  };
}

export async function getCurrentRelationship() {
  try {
    const session = await getSession();
    if (!session) return null;

    return prisma.relationship.findFirst({
      where: {
        OR: [{ partnerAId: session.user.id }, { partnerBId: session.user.id }],
        deletedAt: null,
        status: { in: ["WAITING_PARTNER", "ACTIVE"] },
      },
      include: {
        partnerA: { select: { id: true, displayName: true, username: true, avatarUrl: true, birthDate: true } },
        partnerB: { select: { id: true, displayName: true, username: true, avatarUrl: true, birthDate: true } },
      },
    });
  } catch (err) {
    console.error("getCurrentRelationship error:", err);
    return null;
  }
}

export async function updateRelationship(input: {
  name?: string;
  partnerANickname?: string;
  partnerBNickname?: string;
  startedAt?: string;
  engagementDate?: string;
  marriedAt?: string;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    const data: Record<string, string | Date | null> = {};
    if (input.name !== undefined) data.name = input.name || null;
    if (input.partnerANickname !== undefined) data.partnerANickname = input.partnerANickname || null;
    if (input.partnerBNickname !== undefined) data.partnerBNickname = input.partnerBNickname || null;
    if (input.startedAt) data.startedAt = new Date(input.startedAt);
    if (input.engagementDate !== undefined) data.engagementDate = input.engagementDate ? new Date(input.engagementDate) : null;
    if (input.marriedAt !== undefined) data.marriedAt = input.marriedAt ? new Date(input.marriedAt) : null;

    if (Object.keys(data).length === 0) return { success: true };

    await prisma.relationship.update({
      where: { id: relationship.id },
      data,
    });

    // Update auto-events for current year when dates change
    if (data.startedAt) {
      await updateAutoEventDateForYear(relationship.id, "[AUTO:ANNIVERSARY]", new Date(data.startedAt as Date));
    }
    if (data.marriedAt) {
      await updateAutoEventDateForYear(relationship.id, "[AUTO:ANNIVERSARY]", new Date(data.marriedAt as Date));
    }

    revalidatePath("/relation");
    revalidatePath("/home");
    return { success: true };
  } catch (err) {
    console.error("updateRelationship error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function getPendingInvitation() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: true, data: null };

    const invitation = await prisma.invitation.findFirst({
      where: {
        relationshipId: relationship.id,
        status: "PENDING",
        expiredAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { shortCode: true, expiredAt: true },
    });

    if (!invitation) return { success: true, data: null };

    return {
      success: true,
      data: {
        shortCode: invitation.shortCode,
        expiredAt: invitation.expiredAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("getPendingInvitation error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function ensureInvitation() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    // Check for existing valid invitation
    const existing = await prisma.invitation.findFirst({
      where: {
        relationshipId: relationship.id,
        status: "PENDING",
        expiredAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { shortCode: true, expiredAt: true },
    });

    if (existing) {
      return {
        success: true,
        data: {
          shortCode: existing.shortCode,
          expiredAt: existing.expiredAt.toISOString(),
        },
      };
    }

    // Create a new invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
    const token = randomUUID();
    const shortCode = generateShortCode();

    const invitation = await prisma.invitation.create({
      data: {
        relationshipId: relationship.id,
        token,
        shortCode,
        expiredAt: expiresAt,
      },
    });

    return {
      success: true,
      data: {
        shortCode: invitation.shortCode,
        expiredAt: invitation.expiredAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("ensureInvitation error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

/** Signed signature for direct banner image uploads. */
export async function getBannerSignature() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = {
      timestamp,
      folder: BANNER_FOLDER,
    };
    const signature = generateSignature(params);

    return {
      success: true,
      data: {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
        folder: BANNER_FOLDER,
        resourceType: "image" as const,
      },
    };
  } catch (err) {
    console.error("getBannerSignature error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

/** Persist a freshly-uploaded banner URL and delete the previous one. */
export async function saveBannerUrl(url: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    await prisma.relationship.update({
      where: { id: relationship.id },
      data: { bannerUrl: url },
    });

    if (relationship.bannerUrl && relationship.bannerUrl !== url) {
      await deleteFromCloudinaryByUrl(relationship.bannerUrl);
    }

    revalidatePath("/relation");
    revalidatePath("/home");

    return { success: true, data: { url } };
  } catch (err) {
    console.error("saveBannerUrl error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED" } };
  }
}

export async function removeBanner() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    await prisma.relationship.update({
      where: { id: relationship.id },
      data: { bannerUrl: null },
    });

    // Delete banner from Cloudinary
    if (relationship.bannerUrl) {
      await deleteFromCloudinaryByUrl(relationship.bannerUrl);
    }

    revalidatePath("/relation");
    revalidatePath("/home");

    return { success: true };
  } catch (err) {
    console.error("removeBanner error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
