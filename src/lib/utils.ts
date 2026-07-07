import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { INVITATION_CODE_CHARSET } from "@/config/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function calculateDaysTogether(startDate: Date | string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateShortCode(length = 5): string {
  let result = "";
  const charset = INVITATION_CODE_CHARSET;
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

export function validateFileSize(file: File, maxSizeMB = 1): void {
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
}
