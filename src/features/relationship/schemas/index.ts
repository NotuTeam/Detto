import { z } from "zod";

export const createRelationshipSchema = z.object({
  name: z.string().max(100).optional(),
  startedAt: z.string().min(1, "Relationship start date is required"),
});

export const joinRelationshipSchema = z.object({
  shortCode: z.string().min(5, "Invitation code must be 5 characters").max(5, "Invitation code must be 5 characters"),
});

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;
export type JoinRelationshipInput = z.infer<typeof joinRelationshipSchema>;
