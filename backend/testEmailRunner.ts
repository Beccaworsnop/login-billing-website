import 'dotenv/config';
import { testEmailConnection, sendTestEmail } from './src/utils/emails';

(async () => {
  console.log("🚀 Running email tests...\n");

  const ok = await testEmailConnection();
  console.log("Email test result:", ok ? "✅ Success" : "❌ Failed");

  if (ok) {
    await sendTestEmail();
  } else {
    console.log("⚠️ Skipping test email because connection failed.");
  }
})();
