import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
  description: z.string().max(500).optional(),
  category: z.string().default("DATE"),
  date: z.string().min(1, "Date is required"),
  locationName: z.string().max(100).optional(),
  locationUrl: z.string().url().optional().or(z.literal("")),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
