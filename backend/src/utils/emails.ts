import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@yourbillingapp.com',
      to: userEmail,
      subject: '🎉 Welcome to Your Billing App!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Welcome to Your Billing App! 🎉</h1>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2>Hi ${userName}! 👋</h2>
            <p>Thank you for signing up! Your account has been successfully created.</p>
          </div>

          <div style="background: #fff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #1e40af;">What you can do now:</h3>
            <ul style="line-height: 1.6;">
              <li>💳 Add your payment methods securely</li>
              <li>💰 Make instant payments</li>
              <li>📊 Track your transaction history</li>
              <li>⚙️ Set spending limits and preferences</li>
              <li>🔔 Customize your notifications</li>
            </ul>
          </div>

          <div style="background: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #15803d;">
              <strong>🔒 Your security is our priority!</strong><br>
              All your payment information is encrypted and secure.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b;">
              Need help? Contact our support team at 
              <a href="mailto:support@yourbillingapp.com" style="color: #2563eb;">support@yourbillingapp.com</a>
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 12px;">
            <p>This email was sent to ${userEmail}</p>
            <p>&copy; 2025 Your Billing App. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
};



export const sendTransactionConfirmation = async (
  userEmail: string, 
  userName: string, 
  amount: number, 
  transactionId: string,
  paymentMethod: { type: string; provider: string; last4Digits: string }
) => {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@yourbillingapp.com',
      to: userEmail,
      subject: '💳 Transaction Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669; text-align: center;">Transaction Successful! ✅</h1>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #16a34a;">
            <h2 style="color: #15803d;">Hi ${userName},</h2>
            <p style="color: #166534;">Your payment has been processed successfully!</p>
          </div>

          <div style="background: #fff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
            <h3 style="color: #374151;">Transaction Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Amount:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">$${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Payment Method:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
                  ${paymentMethod.provider.toUpperCase()} ****${paymentMethod.last4Digits}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Transaction ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${transactionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>

          <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #1d4ed8;">
              📧 This confirmation email serves as your receipt.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b;">
              Questions about this transaction? Contact us at 
              <a href="mailto:support@yourbillingapp.com" style="color: #2563eb;">support@yourbillingapp.com</a>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Transaction confirmation sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send transaction confirmation:', error);
    return false;
  }
};

export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server connection successful');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
};