// This is a completely rewritten version of the deleteSkillTemplate function
// It follows a safer approach with proper transaction management

async function deleteSkillTemplate(id) {
  // Use a single client for the entire transaction
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // First check if the template exists
    const templateCheck = await client.query(
      'SELECT id, name, category FROM skill_templates WHERE id = $1',
      [id]
    );
    
    if (templateCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error(`Skill template with ID ${id} not found`);
    }
    
    const template = templateCheck.rows[0];
    console.log(`Deleting skill template: ${template.name} (${template.category}) with ID ${id}`);
    
    // Execute all deletions in a specific, safe order
    
    // 1. Delete pending skill updates referencing this template
    // First try with skill_template_id (v2 schema)
    console.log("Step 1: Deleting pending skill updates (via skill_template_id)");
    await client.query(
      'DELETE FROM pending_skill_updates WHERE skill_template_id = $1',
      [id]
    );
    
    // Then try with skill_id (legacy schema)
    console.log("Step 2: Deleting pending skill updates (via skill_id)");
    await client.query(
      'DELETE FROM pending_skill_updates WHERE skill_id = $1',
      [id]
    );
    
    // Try with pending_skill_updates_v2 table if it exists
    console.log("Step 3: Checking for and deleting from pending_skill_updates_v2");
    try {
      await client.query(
        'DELETE FROM pending_skill_updates_v2 WHERE skill_template_id = $1',
        [id]
      );
    } catch (err) {
      // This is expected to fail if the table doesn't exist
      console.log("Note: Could not delete from pending_skill_updates_v2, table may not exist");
    }
    
    // 2. Delete any user skills first (this will cascade if foreign keys are set up)
    console.log("Step 4: Deleting user skills referencing this template");
    await client.query(
      'DELETE FROM user_skills WHERE skill_template_id = $1',
      [id]
    );
    
    // 3. Delete project skills referencing this template
    console.log("Step 5: Deleting project skills referencing this template");
    await client.query(
      'DELETE FROM project_skills WHERE skill_id = $1',
      [id]
    );
    
    // 4. Finally, delete the skill template
    console.log("Step 6: Deleting the skill template itself");
    const deleteResult = await client.query(
      'DELETE FROM skill_templates WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (deleteResult.rowCount === 0) {
      // This should never happen since we checked earlier
      await client.query('ROLLBACK');
      throw new Error(`Failed to delete skill template ${id}`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log(`Successfully deleted skill template ${id}`);
    
    return {
      success: true,
      message: `Successfully deleted skill template ${id}`
    };
  } catch (error) {
    // Ensure rollback happens
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }
    
    console.error(`Error deleting skill template ${id}:`, error);
    throw error;
  } finally {
    // Always release the client
    client.release();
  }
}