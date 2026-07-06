"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { getCurrentRelationship } from "@/features/relationship/actions";
import { createNoteSchema, type CreateNoteInput } from "../schemas";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";

const NOTE_TTL_HOURS = 24;
const NOTES_EVENT_TAG = "[AUTO:NOTES_CONTAINER]";

async function getOrCreateNotesEvent(relationshipId: string, userId: string) {
  const existing = await prisma.event.findFirst({
    where: {
      relationshipId,
      description: NOTES_EVENT_TAG,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  const event = await prisma.event.create({
    data: {
      relationshipId,
      createdBy: userId,
      title: "Notes",
      description: NOTES_EVENT_TAG,
      category: "OTHER",
      date: new Date(),
      status: "UPCOMING",
    },
  });

  return event.id;
}

export async function getActiveNotes() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: true, data: [] };

    const now = new Date();

    const notes = await prisma.note.findMany({
      where: {
        relationshipId: relationship.id,
        isHidden: false,
        deletedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        imageUrl: true,
        createdBy: true,
        createdAt: true,
        expiresAt: true,
        creator: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    const serialized = notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      expiresAt: n.expiresAt.toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (err) {
    console.error("getActiveNotes error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function createNote(input: CreateNoteInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    const parsed = createNoteSchema.parse(input);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + NOTE_TTL_HOURS);

    await prisma.note.create({
      data: {
        relationshipId: relationship.id,
        createdBy: session.user.id,
        message: parsed.message || null,
        imageUrl: parsed.imageUrl || null,
        imagePublicId: parsed.imagePublicId || null,
        expiresAt,
      },
    });

    // Also save image to gallery (Media table) with note message as caption
    if (parsed.imageUrl && parsed.imagePublicId) {
      const notesEventId = await getOrCreateNotesEvent(relationship.id, session.user.id);
      await prisma.media.create({
        data: {
          eventId: notesEventId,
          uploadedBy: session.user.id,
          publicId: parsed.imagePublicId,
          url: parsed.imageUrl,
          mimeType: "image/jpeg",
          size: 0,
          caption: parsed.message || null,
        },
      });
      revalidatePath("/memories");
    }

    revalidatePath("/home");
    return { success: true };
  } catch (err) {
    console.error("createNote error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function hideNote(noteId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.createdBy !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    await prisma.note.update({
      where: { id: noteId },
      data: { isHidden: true },
    });

    revalidatePath("/home");
    return { success: true };
  } catch (err) {
    console.error("hideNote error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function deleteNote(noteId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.createdBy !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    // Don't destroy Cloudinary image - it may still be referenced in gallery (Media table)
    await prisma.note.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/home");
    return { success: true };
  } catch (err) {
    console.error("deleteNote error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function uploadNoteImage(file: File) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "detto/notes",
      resource_type: "image",
    });

    return {
      success: true,
      data: { url: result.secure_url, publicId: result.public_id },
    };
  } catch (err) {
    console.error("uploadNoteImage error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED" } };
  }
}
