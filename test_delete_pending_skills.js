// Script to diagnose and fix the pending_skill_updates issue

import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

// Create a database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function diagnoseAndFixPendingSkillUpdates() {
  const client = await pool.connect();
  console.log("Connected to database successfully");
  
  try {
    // First check the structure of the pending_skill_updates table
    console.log("Checking pending_skill_updates structure...");
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pending_skill_updates'
      ORDER BY ordinal_position;
    `);
    
    console.log("Table structure:");
    tableStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check for references to skill template 83
    console.log("\nChecking for pending updates referencing skill template 83...");
    const pendingUpdatesCheck = await client.query(`
      SELECT * FROM pending_skill_updates
      WHERE skill_id = 83 OR skill_template_id = 83;
    `);
    
    console.log(`Found ${pendingUpdatesCheck.rows.length} pending updates referencing skill template 83`);
    
    if (pendingUpdatesCheck.rows.length > 0) {
      console.log("Pending updates:");
      pendingUpdatesCheck.rows.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
      
      // Temporarily delete these records to test if our deletion works
      console.log("\nDeleting pending updates referencing skill template 83...");
      await client.query('BEGIN');
      
      let deletedCount = 0;
      // Try skill_template_id if it exists
      try {
        const deleteResult = await client.query(`
          DELETE FROM pending_skill_updates
          WHERE skill_template_id = 83
          RETURNING id;
        `);
        deletedCount += deleteResult.rowCount;
        console.log(`Deleted ${deleteResult.rowCount} records using skill_template_id reference`);
      } catch (error) {
        console.log("Error deleting using skill_template_id:", error.message);
      }
      
      // Try skill_id as fallback
      try {
        const deleteResult = await client.query(`
          DELETE FROM pending_skill_updates
          WHERE skill_id = 83
          RETURNING id;
        `);
        deletedCount += deleteResult.rowCount;
        console.log(`Deleted ${deleteResult.rowCount} records using skill_id reference`);
      } catch (error) {
        console.log("Error deleting using skill_id:", error.message);
      }
      
      console.log(`Total deleted pending updates: ${deletedCount}`);
      
      // Check for constraints on pending_skill_updates
      console.log("\nChecking constraints on pending_skill_updates...");
      const constraints = await client.query(`
        SELECT con.conname as constraint_name,
               pg_get_constraintdef(con.oid) as constraint_definition
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'pending_skill_updates'
          AND nsp.nspname = 'public';
      `);
      
      console.log("Constraints:");
      constraints.rows.forEach(con => {
        console.log(`  ${con.constraint_name}: ${con.constraint_definition}`);
      });
      
      // If we succeed, commit the transaction
      await client.query('COMMIT');
      
      // Now try to delete the skill template again
      console.log("\nTrying to delete skill template 83...");
      await client.query('BEGIN');
      try {
        await client.query('DELETE FROM skill_templates WHERE id = 83 RETURNING id');
        console.log("Successfully deleted skill template 83");
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error("Failed to delete skill template:", error);
      }
    } else {
      console.log("No pending updates found referencing skill template 83");
    }
    
  } catch (error) {
    console.error("Error:", error);
    await client.query('ROLLBACK').catch(() => {});
  } finally {
    client.release();
    await pool.end();
  }
}

diagnoseAndFixPendingSkillUpdates().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});