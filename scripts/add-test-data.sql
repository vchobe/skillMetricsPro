-- Test User 1
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser1', 'testuser1@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 1', false);

-- Test User 2
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser2', 'testuser2@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 2', false);

-- Test User 3
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser3', 'testuser3@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 3', false);

-- Test User 4
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser4', 'testuser4@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 4', false);

-- Test User 5
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser5', 'testuser5@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 5', false);

-- Test User 6
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser6', 'testuser6@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 6', false);

-- Test User 7
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser7', 'testuser7@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 7', false);

-- Test User 8
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser8', 'testuser8@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 8', false);

-- Test User 9
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser9', 'testuser9@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 9', false);

-- Test User 10
INSERT INTO users (username, email, password, "firstName", "lastName", is_admin) 
VALUES ('testuser10', 'testuser10@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', 'Test', 'User 10', false);

-- Add skills for User 1
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser1'), 'JavaScript', 'Experience with JavaScript', 'Programming', 'expert', 5, true, NOW(), 3),
((SELECT id FROM users WHERE username = 'testuser1'), 'React', 'Experience with React', 'Development', 'intermediate', 3, false, NOW(), 1),
((SELECT id FROM users WHERE username = 'testuser1'), 'UI/UX Design', 'Experience with UI/UX Design', 'Design', 'beginner', 1, false, NOW(), 0);

-- Add skills for User 2
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser2'), 'Python', 'Experience with Python', 'Programming', 'expert', 6, true, NOW(), 4),
((SELECT id FROM users WHERE username = 'testuser2'), 'Django', 'Experience with Django', 'Development', 'intermediate', 4, false, NOW(), 2),
((SELECT id FROM users WHERE username = 'testuser2'), 'Data Analysis', 'Experience with Data Analysis', 'Data Analysis', 'expert', 7, true, NOW(), 5);

-- Add skills for User 3
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser3'), 'Java', 'Experience with Java', 'Programming', 'intermediate', 4, false, NOW(), 2),
((SELECT id FROM users WHERE username = 'testuser3'), 'Spring Boot', 'Experience with Spring Boot', 'Development', 'beginner', 2, false, NOW(), 1),
((SELECT id FROM users WHERE username = 'testuser3'), 'Team Management', 'Experience with Team Management', 'Leadership', 'expert', 8, true, NOW(), 6);

-- Add skills for User 4
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser4'), 'TypeScript', 'Experience with TypeScript', 'Programming', 'expert', 5, true, NOW(), 3),
((SELECT id FROM users WHERE username = 'testuser4'), 'Angular', 'Experience with Angular', 'Development', 'expert', 6, true, NOW(), 4),
((SELECT id FROM users WHERE username = 'testuser4'), 'Agile Methodology', 'Experience with Agile Methodology', 'Project Management', 'intermediate', 4, false, NOW(), 2);

-- Add skills for User 5
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser5'), 'Rust', 'Experience with Rust', 'Programming', 'beginner', 1, false, NOW(), 0),
((SELECT id FROM users WHERE username = 'testuser5'), 'Graphic Design', 'Experience with Graphic Design', 'Design', 'expert', 7, true, NOW(), 5),
((SELECT id FROM users WHERE username = 'testuser5'), 'SEO', 'Experience with SEO', 'Marketing', 'intermediate', 3, false, NOW(), 1);

-- Add skills for User 6
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser6'), 'C++', 'Experience with C++', 'Programming', 'expert', 9, true, NOW(), 7),
((SELECT id FROM users WHERE username = 'testuser6'), 'Node.js', 'Experience with Node.js', 'Development', 'intermediate', 4, false, NOW(), 2),
((SELECT id FROM users WHERE username = 'testuser6'), 'Public Speaking', 'Experience with Public Speaking', 'Communication', 'expert', 6, true, NOW(), 4);

-- Add skills for User 7
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser7'), 'Go', 'Experience with Go', 'Programming', 'intermediate', 3, false, NOW(), 1),
((SELECT id FROM users WHERE username = 'testuser7'), 'Figma', 'Experience with Figma', 'Design', 'expert', 5, true, NOW(), 3),
((SELECT id FROM users WHERE username = 'testuser7'), 'Strategic Planning', 'Experience with Strategic Planning', 'Leadership', 'beginner', 2, false, NOW(), 0);

-- Add skills for User 8
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser8'), 'SQL', 'Experience with SQL', 'Data Analysis', 'expert', 8, true, NOW(), 6),
((SELECT id FROM users WHERE username = 'testuser8'), 'Power BI', 'Experience with Power BI', 'Data Analysis', 'intermediate', 4, false, NOW(), 2),
((SELECT id FROM users WHERE username = 'testuser8'), 'Excel', 'Experience with Excel', 'Data Analysis', 'expert', 7, true, NOW(), 5);

-- Add skills for User 9
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser9'), 'Scrum', 'Experience with Scrum', 'Project Management', 'expert', 6, true, NOW(), 4),
((SELECT id FROM users WHERE username = 'testuser9'), 'JIRA', 'Experience with JIRA', 'Project Management', 'intermediate', 3, false, NOW(), 1),
((SELECT id FROM users WHERE username = 'testuser9'), 'Conflict Resolution', 'Experience with Conflict Resolution', 'Leadership', 'expert', 5, true, NOW(), 3);

-- Add skills for User 10
INSERT INTO skills (user_id, name, description, category, level, years_of_experience, certification, last_updated, endorsement_count)
VALUES 
((SELECT id FROM users WHERE username = 'testuser10'), 'Tableau', 'Experience with Tableau', 'Data Analysis', 'expert', 6, true, NOW(), 4),
((SELECT id FROM users WHERE username = 'testuser10'), 'Content Marketing', 'Experience with Content Marketing', 'Marketing', 'intermediate', 3, false, NOW(), 1),
((SELECT id FROM users WHERE username = 'testuser10'), 'Social Media Marketing', 'Experience with Social Media Marketing', 'Marketing', 'beginner', 2, false, NOW(), 0);

-- Add skill histories
DO $$
DECLARE
    skill_record RECORD;
BEGIN
    FOR skill_record IN SELECT id, user_id, level FROM skills LOOP
        INSERT INTO skill_histories (skill_id, user_id, previous_level, new_level, date, note)
        VALUES (skill_record.id, skill_record.user_id, NULL, skill_record.level, NOW() - INTERVAL '3 months', 'Initial skill level');
    END LOOP;
END $$;