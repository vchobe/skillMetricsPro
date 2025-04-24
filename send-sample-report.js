/**
 * Utility script to send a sample weekly resource report immediately
 * Run with: node send-sample-report.js
 */

const { sendImmediateWeeklyReport } = require('./server/email');

async function main() {
  console.log('Sending sample weekly resource report...');
  
  try {
    const success = await sendImmediateWeeklyReport();
    
    if (success) {
      console.log('✅ Report sent successfully!');
      console.log(`📧 Email sent to: ${process.env.SALES_TEAM_EMAIL || 'sales@skillsplatform.com'}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    } else {
      console.error('❌ Failed to send report. Check server logs for details.');
    }
  } catch (error) {
    console.error('❌ Error sending report:', error);
  }
}

main().catch(console.error);