import nodemailer from 'nodemailer';

// Create transporter with Ethereal (or fallback to .env for prod later)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // Ethereal uses STARTTLS, so false is correct
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Your Billing App" <noreply@yourbillingapp.com>',
      to: userEmail,
      subject: '🎉 Welcome to Your Billing App!',
      text: `Hi ${userName}, welcome to Your Billing App!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h1 style="color: #2563eb; text-align: center;">Welcome, ${userName}! 🎉</h1>
          <p style="text-align:center;">Thanks for joining us! Your account is ready.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${userEmail}`);
    console.log('📨 Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error.message || error);
    return false;
  }
};

/**
 * Send transaction confirmation
 */
export const sendTransactionConfirmation = async (
  userEmail: string,
  userName: string,
  amount: number,
  transactionId: string,
  paymentMethod: { type: string; provider: string; last4Digits: string }
) => {
  try {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Your Billing App" <noreply@yourbillingapp.com>',
      to: userEmail,
      subject: '💳 Transaction Confirmation',
      text: `Hi ${userName}, your transaction of $${amount.toFixed(2)} with ${paymentMethod.provider} ****${paymentMethod.last4Digits} was successful. Transaction ID: ${transactionId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h1 style="color: #059669; text-align: center;">Transaction Successful ✅</h1>
          <p>Hi ${userName},</p>
          <p>Your payment of <strong>$${amount.toFixed(2)}</strong> was processed successfully.</p>
          <p><strong>Payment Method:</strong> ${paymentMethod.provider.toUpperCase()} ****${paymentMethod.last4Digits}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Transaction confirmation sent to ${userEmail}`);
    console.log('📨 Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send transaction confirmation:', error.message || error);
    return false;
  }
};

/**
 * Verify connection to SMTP server
 */
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Email server connection failed:', error.message || error);
    return false;
  }
};

/**
 * Send a simple test email (works with Ethereal)
 */
export const sendTestEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"Test" <noreply@test.com>',
      to: process.env.TEST_EMAIL || process.env.SMTP_USER, // fallback to self
      subject: 'Hello Ethereal 🚀',
      text: 'If you see this, Ethereal is working!',
      html: '<p>If you see this, <b>Ethereal is working!</b></p>'
    });

    console.log('✅ Test email sent!');
    console.log('📨 Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send test email:', error.message || error);
    return false;
  }
};
