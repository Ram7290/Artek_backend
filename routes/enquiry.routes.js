import { Router } from "express";
import { createEnquiry } from "../controllers/enquiry.controller.js";
import { enquiryLimiter } from "../middleware/rateLimit.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.middleware.js";

/** Public website endpoints. */
export const enquiryRoutes = Router();

enquiryRoutes.post("/", enquiryLimiter, asyncHandler(createEnquiry));

export default enquiryRoutes;
