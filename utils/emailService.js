require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Set SendGrid API Key from environment variables
const sendGridApiKey = process.env.SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY';
sgMail.setApiKey(sendGridApiKey);

/**
 * Sends an email using SendGrid.
 * @param {string} to - Recipient's email.
 * @param {string} subject - Email subject.
 * @param {string} text - Plain text content.
 * @param {string} [html] - HTML content (optional).
 * @returns {Promise<object>} - SendGrid response.
 */
const sendEmail = async (to, subject, text, html = '') => {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'your_verified_email@example.com', // Must be a verified email in SendGrid
      subject,
      text,
      html: html || `<p>${text}</p>`, // Default HTML version of text
    };

    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body : error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
