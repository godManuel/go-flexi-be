const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const User = require('../models/User');

// Load and compile the template once
const templatePath = path.join(__dirname, '../views/emails/notification.hbs');
const templateSource = fs.readFileSync(templatePath, 'utf8');
const compiledTemplate = Handlebars.compile(templateSource);

const sendEmailToAllUsers = async (subject, message) => {
  const client = SibApiV3Sdk.ApiClient.instance;
  const apiKey = client.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const users = await User.find({
    role: { $ne: 'admin' },
    email: { $exists: true, $ne: null }
  });

  const htmlContent = compiledTemplate({
    subject,
    message,
    year: new Date().getFullYear()
  });

  const sendEmailPromises = users.map(user => {
    const emailParams = {
      sender: { name: 'Rulsar', email: 'info@rulsar.com' },
      to: [{ email: user.email }],
      subject,
      htmlContent
    };
    return apiInstance.sendTransacEmail(emailParams);
  });

  try {
    await Promise.all(sendEmailPromises);
    console.log('Emails sent');
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

module.exports = { sendEmailToAllUsers };
