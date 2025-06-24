const { sendEmailToAllUsers } = require('../utils/brevo');

exports.broadcastNotification = async (req, res) => {
  const { subject, message } = req.body;

  // Validate input
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  try {
    await sendEmailToAllUsers(subject, message);
    res.status(200).json({ message: 'Email notifications sent successfully' });
  } catch (err) {
    console.error('Failed to send email notifications:', err);
    res.status(500).json({ error: 'Failed to send email notifications' });
  }
};
