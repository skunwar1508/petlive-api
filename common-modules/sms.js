
const axios = require('axios');

const sendOTPSms = async (mobile, otp) => {
  const mobileNumber = "91" + mobile;
  const senderId = "JLDHAR";
  const message = `${otp} is the verification code to log in to your Jaldharasupply Account. OTP is confidential. Please do not disclose it. Team Jaldharasupply`;
  const route = 4;

  // Prepare the POST data
  const postData = {
    mobiles: mobileNumber,
    message: encodeURIComponent(message),
    sender: senderId,
    route: route,
    DLT_TE_ID: '1707172439500427680'
  };

  // URL for MSG91 API
  const url = "https://api.msg91.com/api/v2/sendsms";

  try {
    const response = await axios.post(url, postData, {
      headers: {
        authkey: '400058AHadqFsB3fVl64ad1d70P1',
        'Content-Type': 'multipart/form-data'
      }
    });

    // Make sure to parse the response as JSON if applicable
    const data = response.data;
    
    console.log('Response:', data);
    return true;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return false;
  }
};


module.exports = {
  sendOTPSms,
};
