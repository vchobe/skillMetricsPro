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