/**
 * Utility script to send a sample weekly resource report immediately
 * This script sets up the database connection and environment before sending the report
 * Run with: node send-report-now.js
 */

// Using ES modules
import { pool } from './server/db.ts';
import { sendImmediateWeeklyReport } from './server/email.ts';

async function main() {
  console.log('Starting report generation process...');
  console.log('Database URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : 'Not set');
  console.log('Sales team email:', process.env.SALES_TEAM_EMAIL || 'Not set (using fallback)');
  console.log('Mailjet API key:', process.env.MAILJET_API_KEY ? '✓ Configured' : '✗ Missing');
  console.log('Mailjet Secret key:', process.env.MAILJET_SECRET_KEY ? '✓ Configured' : '✗ Missing');
  
  try {
    // Test database connection
    console.log('Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection successful!');
    
    // Send the report
    console.log('Generating and sending weekly resource report...');
    const success = await sendImmediateWeeklyReport();
    
    if (success) {
      console.log('✅ Report sent successfully!');
      console.log(`📧 Email sent to: ${process.env.SALES_TEAM_EMAIL || 'sales@skillsplatform.com'}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    } else {
      console.error('❌ Failed to send report. Check server logs for details.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection pool closed');
  }
}

main().catch(console.error);