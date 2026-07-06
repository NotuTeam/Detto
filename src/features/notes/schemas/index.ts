import { z } from "zod";

export const createNoteSchema = z.object({
  message: z.string().max(500, "Message must be at most 500 characters").optional(),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
}).refine((data) => data.message || data.imageUrl, {
  message: "A note must have a message or an image",
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
