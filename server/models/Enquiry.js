import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
  phone: { type: String, trim: true, maxlength: 20, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  // optional extras from the existing contact form
  business: { type: String, trim: true, maxlength: 120, default: '' },
  service: { type: String, maxlength: 60, default: '' },
  budget: { type: String, maxlength: 60, default: '' },
}, { timestamps: true, collection: 'enquiries' }); // createdAt + updatedAt

export default mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
