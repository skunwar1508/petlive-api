const twilio = require('twilio');

// Twilio credentials (use environment variables for security)
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_ACCOUNT_SID';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_AUTH_TOKEN';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || 'YOUR_TWILIO_PHONE_NUMBER';

const client = new twilio(accountSid, authToken);

/**
 * Sends an SMS using Twilio.
 * @param {string} to - Recipient's phone number (e.g., +1234567890).
 * @param {string} message - SMS content.
 * @returns {Promise<object>} - Twilio response object.
 */
const sendSms = async (to, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });
    console.log('SMS sent successfully:', response.sid);
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendSms;
