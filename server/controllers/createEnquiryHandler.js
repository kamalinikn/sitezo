import { validateEnquiry } from '../utils/validate.js';

// Order: 1 validate -> 2 save to MongoDB -> 3/4 email + SMS (best-effort) -> 5 JSON response.
// Dependencies are injected so the flow can be tested without a database.
export function makeCreateEnquiry({ Enquiry, notify }) {
  return async function createEnquiry(req, res) {
    const { value, error } = validateEnquiry(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    let doc;
    try {
      doc = await Enquiry.create(value);
    } catch (e) {
      console.error('Enquiry NOT saved:', e.name, e.message);
      if (e.name === 'ValidationError')
        return res.status(400).json({ success: false, message: 'Please check your details and try again.' });
      return res.status(500).json({ success: false, message: "We couldn't save your enquiry right now. Please try again in a moment." });
    }

    try {
      await notify(doc);
    } catch (e) {
      console.error('Notification step failed (enquiry is saved):', e.message);
    }
    return res.status(201).json({ success: true, message: 'Your enquiry has been submitted successfully.' });
  };
}
