const nodemailer = require("nodemailer");
const path = require("path");

exports.sendEmail = async (to, subject, template, context) => {
  const hbs = (await import("nodemailer-express-handlebars")).default;

  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_SERVER, // e.g., 'smtp-relay.brevo.com'
    port: process.env.BREVO_PORT,
    secure: false,
    auth: {
      user: process.env.BREVO_LOGIN,
      pass: process.env.BREVO_PASSWORD, // your email account password
    },
  });

  // Set viewPath to the root folder dynamically
  const viewPath = path.resolve(process.cwd(), "views/emails");

  // Configure Handlebars for Email Templates
  transporter.use(
    "compile",
    hbs({
      viewEngine: {
        extname: ".hbs",
        partialsDir: viewPath,
        defaultLayout: false,
      },
      viewPath: viewPath,
      extName: ".hbs",
    })
  );

  const mailOptions = {
    from: '"Rulsar" <hellorulsar@gmail.com>',
    to: to,
    subject: subject,
    template: template,
    context: context,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("Message sent: %s", info.messageId);
};
