import { z } from "zod";
import { ENQUIRY_STATUSES } from "./constants.js";

/**
 * Request validation — mirrors frontend/src/lib/validation.ts but is the
 * authority: never trust the browser. Unknown fields are stripped.
 */
export const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  companyName: z.string().trim().max(160).optional().default(""),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a phone number")
    .max(40)
    .regex(/^[+()\d\s.-]+$/, "Please enter a valid phone number"),
  service: z.string().trim().min(1, "Please select a service").max(120),
  emirate: z.string().trim().min(1, "Please select an emirate").max(60),
  message: z.string().trim().max(4000).optional().default(""),
  source: z.string().trim().max(80).optional().default("website-contact-form"),
  /** Honeypot — bots fill every field; humans never see it. */
  website: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(200),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
});

export const blogPostSchema = z.object({
  title: z.string().trim().min(5, "Enter a title (at least 5 characters)").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Enter a URL slug")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  dek: z.string().trim().max(300).optional().default(""),
  category: z.string().trim().min(1, "Choose a category").max(80),
  authorId: z.string().trim().min(1).max(60),
  content: z.string().max(60000).optional().default(""),
  coverImage: z.string().max(300).nullable().optional(),
  coverAlt: z.string().trim().max(200).nullable().optional(),
  seoTitle: z.string().trim().max(120).nullable().optional(),
  seoDescription: z.string().trim().max(300).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  publishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date format YYYY-MM-DD")
    .nullable()
    .optional(),
});

export const blogPostUpdateSchema = blogPostSchema.partial();

/** Flattens a ZodError into `{ field: ["msg", ...] }` for the client. */
export const fieldErrors = (error) =>
  Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(([, v]) => v && v.length),
  );
