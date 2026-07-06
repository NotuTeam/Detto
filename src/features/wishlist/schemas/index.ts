import { z } from "zod";

export const createWishlistSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
  content: z.string().max(500).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  linkUrls: z.array(z.string().url()).optional(),
  category: z.string().default("GENERAL"),
});

export const updateWishlistSchema = createWishlistSchema.partial();

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>;
