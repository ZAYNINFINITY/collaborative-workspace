const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com";
    const portRaw = process.env.SMTP_PORT || process.env.EMAIL_PORT || 587;
    const port = typeof portRaw === "string" ? Number(portRaw) : portRaw;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async sendInviteEmail(email, workspaceName, inviteUrl) {
    if (process.env.NODE_ENV === "test") return;

    const mailOptions = {
      from:
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER,
      to: email,
      subject: `You're invited to join ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Workspace Invitation</h2>
          <p>You've been invited to join the workspace: <strong>${workspaceName}</strong></p>
          <p>Click the button below to accept your invitation:</p>
          <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Accept Invitation</a>
          <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
          <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ INVITATION EMAIL SENT to ${email}`, {
        messageId: result.messageId,
      });
    } catch (error) {
      console.error(
        "❌ FAILED to send invitation email to",
        email,
        error.message,
      );
      throw error;
    }
  }

  async sendWelcomeEmail(email, workspaceName) {
    if (process.env.NODE_ENV === "test") return;

    const mailOptions = {
      from:
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER,
      to: email,
      subject: `Welcome to ${workspaceName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ${workspaceName}!</h2>
          <p>You've successfully joined the workspace. You can now start collaborating with your team.</p>
          <p>Get started by:</p>
          <ul>
            <li>Adding notes and tasks</li>
            <li>Inviting other team members</li>
            <li>Using the chat feature</li>
          </ul>
          <p>Happy collaborating! 🚀</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ WELCOME EMAIL SENT to ${email}`, {
        messageId: result.messageId,
      });
    } catch (error) {
      console.error("❌ FAILED to send welcome email to", email, error.message);
      throw error;
    }
  }
}

module.exports = new EmailService();
