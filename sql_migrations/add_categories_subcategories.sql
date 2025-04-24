-- Add default categories
INSERT INTO skill_categories (name, description, color, icon, visibility)
VALUES 
('Programming Languages', 'Core programming languages and related technologies', '#3B82F6', 'code', 'visible'),
('Frameworks', 'Software frameworks and libraries', '#10B981', 'layers', 'visible'),
('Data Science', 'Data science, analytics, and machine learning', '#8B5CF6', 'database', 'visible'),
('DevOps', 'Development operations, CI/CD, and infrastructure', '#F59E0B', 'server', 'visible'),
('Design', 'UI/UX design, graphic design, and related tools', '#EC4899', 'palette', 'visible'),
('Soft Skills', 'Communication, leadership, and other non-technical skills', '#6366F1', 'users', 'visible');

-- Add subcategories
-- Programming Languages subcategories
INSERT INTO skill_subcategories (name, description, category_id, color, icon)
VALUES
('Frontend', 'Languages used primarily for frontend development', (SELECT id FROM skill_categories WHERE name = 'Programming Languages'), '#3B82F6', 'layout'),
('Backend', 'Languages used primarily for backend development', (SELECT id FROM skill_categories WHERE name = 'Programming Languages'), '#2563EB', 'server'),
('Mobile', 'Languages used primarily for mobile app development', (SELECT id FROM skill_categories WHERE name = 'Programming Languages'), '#1D4ED8', 'smartphone'),
('General Purpose', 'General purpose programming languages', (SELECT id FROM skill_categories WHERE name = 'Programming Languages'), '#1E40AF', 'code');

-- Frameworks subcategories
INSERT INTO skill_subcategories (name, description, category_id, color, icon)
VALUES
('Web Frontend', 'Frontend web development frameworks', (SELECT id FROM skill_categories WHERE name = 'Frameworks'), '#10B981', 'globe'),
('Web Backend', 'Backend web development frameworks', (SELECT id FROM skill_categories WHERE name = 'Frameworks'), '#059669', 'server'),
('Mobile', 'Mobile app development frameworks', (SELECT id FROM skill_categories WHERE name = 'Frameworks'), '#047857', 'smartphone'),
('Cross-platform', 'Cross-platform development frameworks', (SELECT id FROM skill_categories WHERE name = 'Frameworks'), '#065F46', 'layers');

-- Data Science subcategories
INSERT INTO skill_subcategories (name, description, category_id, color, icon)
VALUES
('Machine Learning', 'Machine learning and AI frameworks and tools', (SELECT id FROM skill_categories WHERE name = 'Data Science'), '#8B5CF6', 'brain'),
('Data Analysis', 'Data analysis and processing tools', (SELECT id FROM skill_categories WHERE name = 'Data Science'), '#7C3AED', 'bar-chart'),
('Visualization', 'Data visualization tools and libraries', (SELECT id FROM skill_categories WHERE name = 'Data Science'), '#6D28D9', 'pie-chart'),
('Big Data', 'Big data processing and management', (SELECT id FROM skill_categories WHERE name = 'Data Science'), '#5B21B6', 'database');

-- DevOps subcategories
INSERT INTO skill_subcategories (name, description, category_id, color, icon)
VALUES
('CI/CD', 'Continuous integration and delivery tools', (SELECT id FROM skill_categories WHERE name = 'DevOps'), '#F59E0B', 'git-merge'),
('Cloud', 'Cloud platforms and services', (SELECT id FROM skill_categories WHERE name = 'DevOps'), '#D97706', 'cloud'),
('Containerization', 'Container technologies and orchestration', (SELECT id FROM skill_categories WHERE name = 'DevOps'), '#B45309', 'box'),
('Infrastructure', 'Infrastructure as code and management', (SELECT id FROM skill_categories WHERE name = 'DevOps'), '#92400E', 'server');

-- Design subcategories
INSERT INTO skill_subcategories (name, description, category_id, color, icon)
VALUES
('UI/UX', 'User interface and experience design', (SELECT id FROM skill_categories WHERE name = 'Design'), '#EC4899', 'layout'),
('Graphics', 'Graphic design and illustration', (SELECT id FROM skill_categories WHERE name = 'Design'), '#DB2777', 'image'),
('Prototyping', 'Design prototyping and wireframing', (SELECT id FROM skill_categories WHERE name = 'Design'), '#BE185D', 'pen-tool'),
('Motion', 'Motion design and animation', (SELECT id FROM skill_categories WHERE name = 'Design'), '#9D174D', 'video');

-- Soft Skills subcategories
INSERT INTO skill_subcategories (name, description, category_id, color, icon)
VALUES
('Communication', 'Verbal and written communication skills', (SELECT id FROM skill_categories WHERE name = 'Soft Skills'), '#6366F1', 'message-circle'),
('Leadership', 'Team leadership and management', (SELECT id FROM skill_categories WHERE name = 'Soft Skills'), '#4F46E5', 'users'),
('Project Management', 'Project management methodologies and skills', (SELECT id FROM skill_categories WHERE name = 'Soft Skills'), '#4338CA', 'clipboard-list'),
('Collaboration', 'Team collaboration and interpersonal skills', (SELECT id FROM skill_categories WHERE name = 'Soft Skills'), '#3730A3', 'users');