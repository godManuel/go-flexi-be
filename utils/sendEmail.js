const nodemailer = require("nodemailer");
const path = require("path");
const handlebars = require("nodemailer-express-handlebars");

const viewPath = path.resolve(process.cwd(), "views/emails");

/**
 * SMTP transporter
 *
 * Created once and reused for all emails.
 */
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_SERVER,
  port: Number(process.env.BREVO_PORT) || 587,
  secure: Number(process.env.BREVO_PORT) === 465,

  auth: {
    user: process.env.BREVO_LOGIN,
    pass: process.env.BREVO_PASSWORD,
  },
});

/**
 * Configure Handlebars once.
 */
transporter.use(
  "compile",
  handlebars({
    viewEngine: {
      extname: ".hbs",
      partialsDir: viewPath,
      defaultLayout: false,
    },

    viewPath,
    extName: ".hbs",
  }),
);

/**
 * Default sender.
 */
const defaultFrom = process.env.SMTP_FROM || '"Rulsar" <hellorulsar@gmail.com>';

/**
 * Send an email using a Handlebars template.
 *
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} options.template
 * @param {Object} options.context
 * @param {string} [options.from]
 */
const sendEmail = async ({
  to,
  subject,
  template,
  context = {},
  from = defaultFrom,
}) => {
  if (!to) {
    throw new Error("Email recipient is required");
  }

  if (!subject) {
    throw new Error("Email subject is required");
  }

  if (!template) {
    throw new Error("Email template is required");
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      template,
      context,
    });

    console.log(`Email sent successfully: ${info.messageId}`);

    return info;
  } catch (error) {
    console.error("Failed to send email:", {
      to,
      subject,
      template,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Send withdrawal-funded notification.
 */
const sendFundingNotification = async (user, withdrawal) => {
  return sendEmail({
    to: user.email,

    subject: "Your DWC withdrawal has been funded",

    template: "withdrawal-funded",

    context: {
      name: user.name,
      amount: withdrawal.amount,
      withdrawalReference: withdrawal._id,
    },
  });
};

module.exports = {
  sendEmail,
  sendFundingNotification,
};
