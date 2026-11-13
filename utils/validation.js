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

/** Flattens a ZodError into `{ field: ["msg", ...] }` for the client. */
export const fieldErrors = (error) =>
  Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(([, v]) => v && v.length),
  );
