-- Test User 1
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser1', 'testuser1@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 2
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser2', 'testuser2@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 3
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser3', 'testuser3@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 4
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser4', 'testuser4@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 5
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser5', 'testuser5@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 6
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser6', 'testuser6@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 7
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser7', 'testuser7@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 8
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser8', 'testuser8@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 9
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser9', 'testuser9@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Test User 10
INSERT INTO users (username, email, password, is_admin) 
VALUES ('testuser10', 'testuser10@example.com', 'c01e1a6c23a7c27f9a43272544953d14ea30dac03d955899e124e389f27fd93622cd58034d0708caa0e3e56c184c3a3bcaae8ef6c0fc741070dfa4d05f7e8deb.ccdcb8c7f7d7ca6ef7b11a1aa2ec757d', false);

-- Add skills for User 1
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser1'), 'JavaScript', 'Programming', 'expert', true, NOW(), 3, 'Experience with JavaScript'),
((SELECT id FROM users WHERE username = 'testuser1'), 'React', 'Development', 'intermediate', false, NOW(), 1, 'Experience with React'),
((SELECT id FROM users WHERE username = 'testuser1'), 'UI/UX Design', 'Design', 'beginner', false, NOW(), 0, 'Experience with UI/UX Design');

-- Add skills for User 2
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser2'), 'Python', 'Programming', 'expert', true, NOW(), 4, 'Experience with Python'),
((SELECT id FROM users WHERE username = 'testuser2'), 'Django', 'Development', 'intermediate', false, NOW(), 2, 'Experience with Django'),
((SELECT id FROM users WHERE username = 'testuser2'), 'Data Analysis', 'Data Analysis', 'expert', true, NOW(), 5, 'Experience with Data Analysis');

-- Add skills for User 3
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser3'), 'Java', 'Programming', 'intermediate', false, NOW(), 2, 'Experience with Java'),
((SELECT id FROM users WHERE username = 'testuser3'), 'Spring Boot', 'Development', 'beginner', false, NOW(), 1, 'Experience with Spring Boot'),
((SELECT id FROM users WHERE username = 'testuser3'), 'Team Management', 'Leadership', 'expert', true, NOW(), 6, 'Experience with Team Management');

-- Add skills for User 4
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser4'), 'TypeScript', 'Programming', 'expert', true, NOW(), 3, 'Experience with TypeScript'),
((SELECT id FROM users WHERE username = 'testuser4'), 'Angular', 'Development', 'expert', true, NOW(), 4, 'Experience with Angular'),
((SELECT id FROM users WHERE username = 'testuser4'), 'Agile Methodology', 'Project Management', 'intermediate', false, NOW(), 2, 'Experience with Agile Methodology');

-- Add skills for User 5
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser5'), 'Rust', 'Programming', 'beginner', false, NOW(), 0, 'Experience with Rust'),
((SELECT id FROM users WHERE username = 'testuser5'), 'Graphic Design', 'Design', 'expert', true, NOW(), 5, 'Experience with Graphic Design'),
((SELECT id FROM users WHERE username = 'testuser5'), 'SEO', 'Marketing', 'intermediate', false, NOW(), 1, 'Experience with SEO');

-- Add skills for User 6
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser6'), 'C++', 'Programming', 'expert', true, NOW(), 7, 'Experience with C++'),
((SELECT id FROM users WHERE username = 'testuser6'), 'Node.js', 'Development', 'intermediate', false, NOW(), 2, 'Experience with Node.js'),
((SELECT id FROM users WHERE username = 'testuser6'), 'Public Speaking', 'Communication', 'expert', true, NOW(), 4, 'Experience with Public Speaking');

-- Add skills for User 7
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser7'), 'Go', 'Programming', 'intermediate', false, NOW(), 1, 'Experience with Go'),
((SELECT id FROM users WHERE username = 'testuser7'), 'Figma', 'Design', 'expert', true, NOW(), 3, 'Experience with Figma'),
((SELECT id FROM users WHERE username = 'testuser7'), 'Strategic Planning', 'Leadership', 'beginner', false, NOW(), 0, 'Experience with Strategic Planning');

-- Add skills for User 8
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser8'), 'SQL', 'Data Analysis', 'expert', true, NOW(), 6, 'Experience with SQL'),
((SELECT id FROM users WHERE username = 'testuser8'), 'Power BI', 'Data Analysis', 'intermediate', false, NOW(), 2, 'Experience with Power BI'),
((SELECT id FROM users WHERE username = 'testuser8'), 'Excel', 'Data Analysis', 'expert', true, NOW(), 5, 'Experience with Excel');

-- Add skills for User 9
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser9'), 'Scrum', 'Project Management', 'expert', true, NOW(), 4, 'Experience with Scrum'),
((SELECT id FROM users WHERE username = 'testuser9'), 'JIRA', 'Project Management', 'intermediate', false, NOW(), 1, 'Experience with JIRA'),
((SELECT id FROM users WHERE username = 'testuser9'), 'Conflict Resolution', 'Leadership', 'expert', true, NOW(), 3, 'Experience with Conflict Resolution');

-- Add skills for User 10
INSERT INTO skills (user_id, name, category, level, certification, last_updated, endorsement_count, notes)
VALUES 
((SELECT id FROM users WHERE username = 'testuser10'), 'Tableau', 'Data Analysis', 'expert', true, NOW(), 4, 'Experience with Tableau'),
((SELECT id FROM users WHERE username = 'testuser10'), 'Content Marketing', 'Marketing', 'intermediate', false, NOW(), 1, 'Experience with Content Marketing'),
((SELECT id FROM users WHERE username = 'testuser10'), 'Social Media Marketing', 'Marketing', 'beginner', false, NOW(), 0, 'Experience with Social Media Marketing');

-- Add skill histories
DO $$
DECLARE
    skill_record RECORD;
BEGIN
    FOR skill_record IN SELECT id, user_id, level FROM skills LOOP
        INSERT INTO skill_histories (skill_id, user_id, previous_level, new_level, change_note)
        VALUES (skill_record.id, skill_record.user_id, NULL, skill_record.level, 'Initial skill level');
    END LOOP;
END $$;