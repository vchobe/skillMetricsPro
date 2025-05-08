/**
 * Improved deleteSkillTemplate function with non-transaction based cascading deletion
 * 
 * This implementation avoids transaction issues by executing each step independently
 * which is safer in cases where there are errors with transaction handling
 * or complex foreign key relationships.
 */

async function deleteSkillTemplate(id, forceCascade = false) {
  console.log(`Deleting skill template with ID ${id} (forceCascade=${forceCascade})`);
  
  try {
    // First check if the template exists
    const templateCheck = await pool.query(
      'SELECT id, name, category FROM skill_templates WHERE id = $1',
      [id]
    );
    
    if (templateCheck.rows.length === 0) {
      console.log(`Skill template with ID ${id} not found`);
      return {
        success: false,
        error: `Skill template with ID ${id} not found`
      };
    }
    
    console.log(`Found template: ${templateCheck.rows[0].name} (${templateCheck.rows[0].category})`);
    
    // Find all user skills to count them for the return value
    const userSkillsResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_skills WHERE skill_template_id = $1',
      [id]
    );
    const userSkillCount = parseInt(userSkillsResult.rows[0].count);
    console.log(`Found ${userSkillCount} user skills referencing this template`);
    
    // Check project skills to see if there are any dependencies
    const projectSkillsResult = await pool.query(
      'SELECT COUNT(*) as count FROM project_skills WHERE skill_id = $1',
      [id]
    );
    const projectSkillCount = parseInt(projectSkillsResult.rows[0].count);
    console.log(`Found ${projectSkillCount} project skills referencing this template`);
    
    // If there are dependencies and forceCascade is false, return an error
    if ((userSkillCount > 0 || projectSkillCount > 0) && !forceCascade) {
      return {
        success: false,
        error: `Cannot delete skill template with ID ${id} because it has ${userSkillCount} user skills and ${projectSkillCount} project skills referencing it. Use forceCascade=true to delete anyway.`,
        dependencies: {
          userSkillCount,
          projectSkillCount
        }
      };
    }
    
    // Execute all deletions in a specific, safe order
    // Each step is executed separately to avoid transaction issues
    
    // 1. First remove notifications that reference user_skills with this template
    console.log("Step 1: Deleting notifications related to template's user skills");
    const notificationsResult = await pool.query(
      'DELETE FROM notifications WHERE related_user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
      [id]
    );
    console.log(`  Deleted ${notificationsResult.rowCount} notifications`);
    
    // 2. Remove endorsements for user_skills with this template
    console.log("Step 2: Deleting endorsements for user skills");
    const endorsementsResult = await pool.query(
      'DELETE FROM endorsements WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
      [id]
    );
    console.log(`  Deleted ${endorsementsResult.rowCount} endorsements`);
    
    // 3. Delete pending skill updates referencing this template
    // Via user_skill_id from skills with this template
    console.log("Step 3: Deleting pending skill updates (via user_skill_id)");
    const psuResult1 = await pool.query(
      'DELETE FROM pending_skill_updates WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
      [id]
    );
    console.log(`  Deleted ${psuResult1.rowCount} pending skill updates via user_skill_id`);
    
    // Via skill_template_id (v2 schema)
    console.log("Step 4: Deleting pending skill updates (via skill_template_id)");
    const psuResult2 = await pool.query(
      'DELETE FROM pending_skill_updates WHERE skill_template_id = $1 RETURNING id',
      [id]
    );
    console.log(`  Deleted ${psuResult2.rowCount} pending skill updates via skill_template_id`);
    
    // Via skill_id (legacy schema)
    console.log("Step 5: Deleting pending skill updates (via skill_id)");
    const psuResult3 = await pool.query(
      'DELETE FROM pending_skill_updates WHERE skill_id = $1 RETURNING id',
      [id]
    );
    console.log(`  Deleted ${psuResult3.rowCount} pending skill updates via skill_id`);
    
    // Try with pending_skill_updates_v2 table if it exists
    try {
      console.log("Step 6: Checking for and deleting from pending_skill_updates_v2");
      const psuV2Result = await pool.query(
        'DELETE FROM pending_skill_updates_v2 WHERE skill_template_id = $1 RETURNING id',
        [id]
      );
      console.log(`  Deleted ${psuV2Result.rowCount} pending skill updates from v2 table`);
    } catch (err) {
      // This is expected to fail if the table doesn't exist
      console.log("  Note: Could not delete from pending_skill_updates_v2, table may not exist");
    }
    
    // 4. Delete history entries for user skills with this template
    console.log("Step 7: Deleting skill histories for user skills with this template");
    const historyResult = await pool.query(
      'DELETE FROM skill_histories WHERE user_skill_id IN (SELECT id FROM user_skills WHERE skill_template_id = $1) RETURNING id',
      [id]
    );
    console.log(`  Deleted ${historyResult.rowCount} skill history entries`);
    
    // 5. Delete user skills referencing this template
    console.log("Step 8: Deleting user skills referencing this template");
    const userSkillsDeleteResult = await pool.query(
      'DELETE FROM user_skills WHERE skill_template_id = $1 RETURNING id',
      [id]
    );
    console.log(`  Deleted ${userSkillsDeleteResult.rowCount} user skills`);
    
    // 6. Delete project skills referencing this template
    console.log("Step 9: Deleting project skills referencing this template");
    const projectSkillsDeleteResult = await pool.query(
      'DELETE FROM project_skills WHERE skill_id = $1 RETURNING id',
      [id]
    );
    console.log(`  Deleted ${projectSkillsDeleteResult.rowCount} project skills`);
    
    // 7. Finally, delete the skill template
    console.log("Step 10: Deleting the skill template itself");
    const deleteResult = await pool.query(
      'DELETE FROM skill_templates WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (deleteResult.rowCount === 0) {
      // This should never happen since we checked earlier
      console.error(`No rows deleted for skill template ${id}`);
      return {
        success: false,
        error: `Failed to delete skill template ${id}`
      };
    }
    
    console.log(`✓ Successfully deleted skill template ${id}`);
    
    return {
      success: true,
      message: `Successfully deleted skill template ${id}`,
      deletedUserSkills: userSkillCount,
      deletedProjectSkills: projectSkillCount
    };
  } catch (error) {
    console.error(`Error deleting skill template ${id}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export the function
module.exports = {
  deleteSkillTemplate
};