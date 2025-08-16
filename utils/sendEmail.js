const nodemailer = require("nodemailer");
const path = require("path");

exports.sendEmail = async (to, subject, template, context) => {
  const hbs = (await import("nodemailer-express-handlebars")).default;

  const transporter = nodemailer.createTransport({
    host: "mail.rulsar.com",
    port: 465, // SSL port
    secure: true, // true because 465 uses SSL
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS, // your email account password
    },
    connectionTimeout: 10000, // 10s timeout
    socketTimeout: 10000,
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
    from: `"Rulsar" <${process.env.AUTH_EMAIL}>`,
    to: to,
    subject: subject,
    template: template,
    context: context,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("Message sent: %s", info.messageId);
};
