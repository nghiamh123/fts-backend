import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendMail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[Mailer] GMAIL_USER or GMAIL_APP_PASSWORD not set, skipping email");
    return null;
  }

  return transporter.sendMail({
    from: `"FROM THE STRESS" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}