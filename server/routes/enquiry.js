import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Enquiry from '../models/Enquiry.js';
import { connectDB } from '../db.js';
import { notifyOwner } from '../services/notifications.js';
import { makeCreateEnquiry } from '../controllers/createEnquiryHandler.js';

const r = Router();
// Make sure MongoDB is connected (cached across serverless invocations) before anything else.
r.use(async (req, res, next) => {
  try { await connectDB(); next(); } catch (e) {
    console.error('MongoDB connection failed:', e.message);
    res.status(503).json({ success: false, message: "We couldn't reach our database right now. Please try again in a moment." });
  }
});
r.use(rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: 'Too many enquiries from this connection. Please try again in a few minutes.' }),
}));
r.post('/', makeCreateEnquiry({ Enquiry, notify: notifyOwner }));
export default r;
