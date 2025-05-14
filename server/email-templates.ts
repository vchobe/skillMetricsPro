export function getWeeklyResourceReportEmailContent(
  reportDate: string,
  reportPeriod: string,
  resourcesAdded: Array<{
    projectName: string,
    projectId: number,
    username: string,
    userId: number,
    userEmail: string,
    role: string,
    startDate: string | null,
    endDate: string | null,
    allocation: number | null,
    addedAt: string
  }>,
  projectLinks: Array<{
    projectId: number,
    projectLink: string
  }>,
  userLinks: Array<{
    userId: number,
    userLink: string
  }>,
  resourceSkills: Record<number, Array<{
    id: number;
    name: string;
    level: string;
    category: string;
    subcategory?: string;
    certification?: string;
  }>> = {}
) {
  // Format the resources data into HTML and text
  let resourcesHtml = '';
  let resourcesText = '';

  if (resourcesAdded.length === 0) {
    resourcesHtml = '<p style="font-style: italic;">No new resources were added to any projects during this period.</p>';
    resourcesText = 'No new resources were added to any projects during this period.\n';
  } else {
    // Group resources by project for better readability
    const projectGroups: { [key: string]: typeof resourcesAdded } = {};
    
    resourcesAdded.forEach(resource => {
      if (!projectGroups[resource.projectName]) {
        projectGroups[resource.projectName] = [];
      }
      projectGroups[resource.projectName].push(resource);
    });

    resourcesHtml = '<div>';

    // Generate report for each project
    Object.entries(projectGroups).forEach(([projectName, resources]) => {
      const firstResource = resources[0];
      const projectLink = projectLinks.find(p => p.projectId === firstResource.projectId)?.projectLink || '#';
      const clientName = (firstResource as any).clientName || "Atyeti Client";
      const clientId = (firstResource as any).clientId;
      const clientLink = clientId ? `${projectLink.split('/projects/')[0]}/clients/${clientId}` : '#';
      
      resourcesHtml += `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #4f46e5; margin-bottom: 10px;">
            <a href="${projectLink}" style="color: #4f46e5; text-decoration: underline;">
              Project: ${projectName}
            </a>
            <span style="font-size: 0.85em; color: #666; font-weight: normal; margin-left: 10px;">
              Client: <a href="${clientLink}" style="color: #4f46e5; text-decoration: underline;">${clientName}</a>
            </span>
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Resource</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Role</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Allocation</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Timeline</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Added On</th>
              </tr>
            </thead>
            <tbody>
      `;

      resourcesText += `\nProject: ${projectName} (Client: ${clientName})\n`;
      resourcesText += `${'-'.repeat(projectName.length + clientName.length + 19)}\n`;

      resources.forEach(resource => {
        const userLink = userLinks.find(u => u.userId === resource.userId)?.userLink || '#';
        const dateRange = resource.startDate && resource.endDate 
          ? `${resource.startDate} to ${resource.endDate}` 
          : resource.startDate
            ? `From ${resource.startDate}`
            : 'No dates specified';
        
        // Get the user's top skills if available
        const userSkills = resourceSkills[resource.userId] || [];
        const skillsSummary = userSkills.length > 0 ? 
          userSkills.map(skill => `${skill.name} (${skill.level})`).join(', ') :
          'No skills information available';
        
        // Create skill badges HTML with appropriate color coding for skill levels
        let skillBadgesHtml = '';
        if (userSkills.length > 0) {
          skillBadgesHtml = '<div style="margin-top: 5px;">';
          userSkills.forEach(skill => {
            // Color coding based on skill level
            let badgeColor = '#9ca3af'; // Default gray
            if (skill.level === 'expert') {
              badgeColor = '#059669'; // Green for expert
            } else if (skill.level === 'intermediate') {
              badgeColor = '#0284c7'; // Blue for intermediate
            } else if (skill.level === 'beginner') {
              badgeColor = '#9333ea'; // Purple for beginner
            }
            
            skillBadgesHtml += `
              <span style="display: inline-block; background-color: ${badgeColor}; color: white; 
                          font-size: 0.7em; padding: 2px 6px; border-radius: 10px; margin-right: 5px; margin-bottom: 3px;">
                ${skill.name} - ${skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
              </span>
            `;
          });
          skillBadgesHtml += '</div>';
        }
        
        resourcesHtml += `
          <tr>
            <td style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">
              <a href="${userLink}" style="color: #4f46e5; text-decoration: underline;">
                ${resource.username}
              </a>
              <div style="font-size: 0.85em; color: #666;">${resource.userEmail}</div>
              ${skillBadgesHtml}
            </td>
            <td style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${resource.role || 'Not specified'}</td>
            <td style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${resource.allocation ? resource.allocation + '%' : 'Not specified'}</td>
            <td style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${dateRange}</td>
            <td style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">${resource.addedAt}</td>
          </tr>
        `;

        resourcesText += `* ${resource.username} (${resource.userEmail})\n`;
        resourcesText += `  Role: ${resource.role || 'Not specified'}\n`;
        resourcesText += `  Allocation: ${resource.allocation ? resource.allocation + '%' : 'Not specified'}\n`;
        resourcesText += `  Timeline: ${dateRange}\n`;
        resourcesText += `  Added On: ${resource.addedAt}\n`;
        resourcesText += `  Skills: ${skillsSummary}\n\n`;
      });

      resourcesHtml += `
            </tbody>
          </table>
        </div>
      `;
    });

    resourcesHtml += '</div>';
  }

  // Complete email text version
  const text = `
Weekly Project Resource Allocation Report
${'-'.repeat(38)}
Report Date: ${reportDate}
Reporting Period: ${reportPeriod}

SKILLS INFORMATION
-----------------
This report now includes a summary of key skills for each resource added to projects.
Skills are categorized by level (Beginner, Intermediate, Expert).

${resourcesText}

This is an automated weekly report from the Employee Skill Metrics system.
  `;

  // Complete email HTML version
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <!-- Header with company name instead of logos -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-size: 20px; font-weight: bold; color: #4f46e5;">
          Skill Metrics
        </div>
        <div style="font-size: 16px; color: #666;">
          Atyeti Inc.
        </div>
      </div>
      
      <h2 style="color: #4f46e5;">Weekly Project Resource Allocation Report</h2>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Report Date:</strong> ${reportDate}</p>
        <p style="margin: 5px 0;"><strong>Reporting Period:</strong> ${reportPeriod}</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4f46e5;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #4f46e5;">Skills Information</h4>
        <p>This report now includes a summary of key skills for each resource. Skills are shown as colored badges:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
          <span style="display: inline-block; background-color: #059669; color: white; font-size: 0.8em; padding: 3px 8px; border-radius: 10px;">Expert Level</span>
          <span style="display: inline-block; background-color: #0284c7; color: white; font-size: 0.8em; padding: 3px 8px; border-radius: 10px;">Intermediate Level</span>
          <span style="display: inline-block; background-color: #9333ea; color: white; font-size: 0.8em; padding: 3px 8px; border-radius: 10px;">Beginner Level</span>
        </div>
      </div>
      
      <h3 style="margin-top: 25px; color: #333;">Resources Added This Week</h3>
      ${resourcesHtml}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #666; font-style: italic;">This is an automated weekly report from the Employee Skill Metrics system.</p>
        <p style="color: #666; font-size: 0.9em;">
          <a href="https://workspace.vinayak1chobe.repl.co" style="color: #4f46e5; text-decoration: underline;">
            Access the Skill Metrics Dashboard
          </a>
        </p>
      </div>
    </div>
  `;

  return { 
    text, 
    html, 
    subject: `Weekly Project Resource Report (${reportPeriod})` 
  };
}

export function getPasswordResetEmailContent(
  username: string,
  temporaryPassword: string
) {
  const text = `
    Hello ${username},
    
    Your password has been reset successfully.
    Please use the following temporary password to log in:
    
    Temporary Password: ${temporaryPassword}
    
    Please change your password immediately after logging in.
    
    Best regards,
    The Employee Skill Metrics Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Password Reset Confirmation</h2>
      <p>Hello ${username},</p>
      <p>Your password has been reset successfully.</p>
      <p>Please use the following temporary password to log in:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      <p style="color: #ef4444;"><strong>Important:</strong> Please change your password immediately after logging in.</p>
      <p>Best regards,<br>The Employee Skill Metrics Team</p>
    </div>
  `;

  return { text, html, subject: "Password Reset Confirmation" };
}

export function getResourceAddedEmailContent(
  projectName: string,
  username: string,
  userEmail: string,
  role: string,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  allocation: number,
  performedBy?: string
) {
  const dateRange = startDate && endDate 
    ? `${startDate} to ${endDate}` 
    : startDate
      ? `Starting ${startDate}`
      : 'No specific dates assigned';
  
  const actionBy = performedBy ? `This action was performed by ${performedBy}.` : '';
  
  const text = `
    Resource Addition Notification
    
    Project: ${projectName}
    Resource: ${username} (${userEmail})
    Role: ${role}
    Allocation: ${allocation}%
    Timeline: ${dateRange}
    
    ${actionBy}
    
    This is an automated notification from the Employee Skill Metrics system.
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Project Resource Addition</h2>
      <p>A new resource has been added to a project:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
        <p style="margin: 5px 0;"><strong>Resource:</strong> ${username} (${userEmail})</p>
        <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
        <p style="margin: 5px 0;"><strong>Allocation:</strong> ${allocation}%</p>
        <p style="margin: 5px 0;"><strong>Timeline:</strong> ${dateRange}</p>
      </div>
      
      ${actionBy ? `<p style="font-style: italic;">${actionBy}</p>` : ''}
      
      <p>This is an automated notification from the Employee Skill Metrics system.</p>
    </div>
  `;

  return { 
    text, 
    html, 
    subject: `Project Resource Added: ${username} to ${projectName}` 
  };
}

export function getResourceRemovedEmailContent(
  projectName: string,
  username: string,
  userEmail: string,
  role: string,
  allocation?: number | null,
  performedBy?: string
) {
  const allocationInfo = allocation ? `${allocation}%` : 'Not specified';
  const actionBy = performedBy ? `This action was performed by ${performedBy}.` : '';
  
  const text = `
    Resource Removal Notification
    
    Project: ${projectName}
    Resource: ${username} (${userEmail})
    Previous Role: ${role}
    Previous Allocation: ${allocationInfo}
    
    ${actionBy}
    
    This is an automated notification from the Employee Skill Metrics system.
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Project Resource Removal</h2>
      <p>A resource has been removed from a project:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
        <p style="margin: 5px 0;"><strong>Resource:</strong> ${username} (${userEmail})</p>
        <p style="margin: 5px 0;"><strong>Previous Role:</strong> ${role}</p>
        <p style="margin: 5px 0;"><strong>Previous Allocation:</strong> ${allocationInfo}</p>
      </div>
      
      ${actionBy ? `<p style="font-style: italic;">${actionBy}</p>` : ''}
      
      <p>This is an automated notification from the Employee Skill Metrics system.</p>
    </div>
  `;

  return { 
    text, 
    html, 
    subject: `Project Resource Removed: ${username} from ${projectName}` 
  };
}

export function getProjectCreatedEmailContent(
  projectName: string,
  clientName: string | null | undefined,
  description: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  leadName: string | null | undefined
) {
  // Format optional fields
  const clientInfo = clientName ? `${clientName}` : 'Not specified';
  const dateRange = startDate ? 
    (endDate ? `${startDate} to ${endDate}` : `Starting ${startDate} (No end date)`) : 
    'Dates not specified';
  const descriptionInfo = description || 'No description provided';
  const leadInfo = leadName || 'Not assigned';
  
  const text = `
    Project Creation Notification
    
    New Project: ${projectName}
    Client: ${clientInfo}
    Timeline: ${dateRange}
    Lead: ${leadInfo}
    
    Description:
    ${descriptionInfo}
    
    This is an automated notification from the Employee Skill Metrics system.
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">New Project Created</h2>
      <p>A new project has been created in the system:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Project Name:</strong> ${projectName}</p>
        <p style="margin: 5px 0;"><strong>Client:</strong> ${clientInfo}</p>
        <p style="margin: 5px 0;"><strong>Timeline:</strong> ${dateRange}</p>
        <p style="margin: 5px 0;"><strong>Project Lead:</strong> ${leadInfo}</p>
        <p style="margin: 10px 0 5px 0;"><strong>Description:</strong></p>
        <p style="margin: 5px 0; padding-left: 15px;">${descriptionInfo}</p>
      </div>
      
      <p>This is an automated notification from the Employee Skill Metrics system.</p>
    </div>
  `;

  return { 
    text, 
    html, 
    subject: `New Project Created: ${projectName}` 
  };
}

export function getProjectUpdatedEmailContent(
  projectName: string,
  clientName: string | null | undefined,
  description: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  leadName: string | null | undefined,
  changedFields: {field: string, oldValue?: string | null, newValue?: string | null}[],
  performedBy?: string
) {
  // Format optional fields
  const clientInfo = clientName ? `${clientName}` : 'Not specified';
  const dateRange = startDate ? 
    (endDate ? `${startDate} to ${endDate}` : `Starting ${startDate} (No end date)`) : 
    'Dates not specified';
  const descriptionInfo = description || 'No description provided';
  const leadInfo = leadName || 'Not assigned';
  const actionBy = performedBy ? `This update was performed by ${performedBy}.` : '';
  
  // Prepare detailed changes list
  let detailedChanges = '';
  let htmlDetailedChanges = '';
  
  if (changedFields.length > 0) {
    detailedChanges = 'Changes made:\n';
    htmlDetailedChanges = '<p style="margin: 5px 0;"><strong>Changes made:</strong></p><ul style="margin-top: 5px;">';
    
    changedFields.forEach(change => {
      const oldValueText = change.oldValue !== undefined && change.oldValue !== null 
        ? change.oldValue 
        : '(not set)';
        
      const newValueText = change.newValue !== undefined && change.newValue !== null 
        ? change.newValue 
        : '(not set)';
      
      detailedChanges += `  - ${change.field}: ${oldValueText} → ${newValueText}\n`;
      htmlDetailedChanges += `<li style="margin: 3px 0;"><strong>${change.field}:</strong> ${oldValueText} → ${newValueText}</li>`;
    });
    
    htmlDetailedChanges += '</ul>';
  } else {
    detailedChanges = 'No significant fields changed';
    htmlDetailedChanges = '<p style="margin: 5px 0;"><em>No significant fields changed</em></p>';
  }
  
  // Format the changes summary (simplified version)
  const changesSummary = changedFields.length > 0 
    ? `Fields updated: ${changedFields.map(c => c.field).join(', ')}` 
    : 'No significant fields changed';
  
  const text = `
    Project Update Notification
    
    Updated Project: ${projectName}
    
    ${detailedChanges}
    
    Current Details:
    Client: ${clientInfo}
    Timeline: ${dateRange}
    Lead: ${leadInfo}
    
    Description:
    ${descriptionInfo}
    
    ${actionBy}
    
    This is an automated notification from the Employee Skill Metrics system.
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Project Updated</h2>
      <p>A project has been updated in the system:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Project Name:</strong> ${projectName}</p>
        
        <div style="background-color: #e8edfb; padding: 10px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #4f46e5;">
          ${htmlDetailedChanges}
        </div>
        
        <hr style="border: 0; border-top: 1px solid #d1d5db; margin: 15px 0;" />
        <p style="margin: 5px 0;"><strong>Current Details:</strong></p>
        <p style="margin: 5px 0;"><strong>Client:</strong> ${clientInfo}</p>
        <p style="margin: 5px 0;"><strong>Timeline:</strong> ${dateRange}</p>
        <p style="margin: 5px 0;"><strong>Project Lead:</strong> ${leadInfo}</p>
        <p style="margin: 10px 0 5px 0;"><strong>Description:</strong></p>
        <p style="margin: 5px 0; padding-left: 15px;">${descriptionInfo}</p>
      </div>
      
      ${actionBy ? `<p style="font-style: italic;">${actionBy}</p>` : ''}
      
      <p>This is an automated notification from the Employee Skill Metrics system.</p>
    </div>
  `;

  return { 
    text, 
    html, 
    subject: `Project Updated: ${projectName}` 
  };
}

/**
 * Gets the content for skill approval notification email
 */
export function getSkillApprovedEmailContent(
  firstName: string,
  skillName: string
) {
  const text = `
Hi ${firstName},

Your submitted skill "${skillName}" has been successfully reviewed and approved.

You can now view it on your profile.

Thank you for keeping your skills up to date!

Best regards,  
Atyeti Skills-Metrics Platform Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Your Skill Has Been Approved!</h2>
      <p>Hi ${firstName},</p>
      <p>Your submitted skill "<strong>${skillName}</strong>" has been successfully reviewed and approved.</p>
      <p>You can now view it on your profile.</p>
      <p>Thank you for keeping your skills up to date!</p>
      <p>Best regards,<br>Atyeti Skills-Metrics Platform Team</p>
    </div>
  `;

  return { 
    text, 
    html, 
    subject: `Your Skill Has Been Approved!` 
  };
}

/**
 * Gets the content for skill rejection notification email
 */
export function getSkillRejectedEmailContent(
  firstName: string,
  skillName: string
) {
  const text = `
Hi ${firstName},

Unfortunately, your submitted skill "${skillName}" could not be approved at this time.

Please review the submission and ensure it meets our skill validation criteria. You can update and resubmit the skill for approval.

If you have any questions, feel free to reach out to support.

Best regards,  
Atyeti Skills-Metrics Platform Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Skill Submission Not Approved</h2>
      <p>Hi ${firstName},</p>
      <p>Unfortunately, your submitted skill "<strong>${skillName}</strong>" could not be approved at this time.</p>
      <p>Please review the submission and ensure it meets our skill validation criteria. You can update and resubmit the skill for approval.</p>
      <p>If you have any questions, feel free to reach out to support.</p>
      <p>Best regards,<br>Atyeti Skills-Metrics Platform Team</p>
    </div>
  `;

  return { 
    text, 
    html, 
    subject: `Skill Submission Not Approved` 
  };
}