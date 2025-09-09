import 'dotenv/config'; // <--- this loads your .env automatically
import { testEmailConnection } from './src/utils/emails'; // adjust path

(async () => {
  const result = await testEmailConnection();
  console.log('Email test result:', result ? '✅ Success' : '❌ Failed');
})();
