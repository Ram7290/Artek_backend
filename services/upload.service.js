import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

/**
 * Blog image uploads. With CLOUDINARY_URL set, images are stored on Cloudinary
 * and the returned address is resized and auto-formatted (WebP/AVIF per
 * browser). Without it, images are kept in the local uploads folder.
 */
const here = dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? resolve(here, "../uploads");

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const useCloudinary = Boolean(process.env.CLOUDINARY_URL);

/** Accepts a data URL (base64 JPEG, PNG or WebP) and returns its public address. */
export async function saveImage(dataUrl) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? "");
  if (!match) return { error: "Upload a JPEG, PNG or WebP image." };

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_IMAGE_BYTES) return { error: "Images must be 5 MB or smaller." };

  if (useCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(dataUrl, { folder: "artek/blog", resource_type: "image" });
      const url = cloudinary.url(result.public_id, {
        secure: true,
        fetch_format: "auto",
        quality: "auto",
        transformation: [{ width: 1600, crop: "limit" }],
      });
      return { url };
    } catch (err) {
      console.error("[upload] Cloudinary upload failed:", err.message);
      return { error: "The image could not be uploaded. Please try again." };
    }
  }

  const name = `${randomUUID()}.${EXTENSIONS[match[1]]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, name), buffer);
  return { url: `/api/uploads/${name}` };
}
