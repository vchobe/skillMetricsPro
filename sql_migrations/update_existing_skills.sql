-- Update existing skills with categories and subcategories based on their current category

-- Update Programming Languages skills
UPDATE skills 
SET 
    category_id = (SELECT id FROM skill_categories WHERE name = 'Programming Languages'),
    subcategory_id = (
        CASE 
            WHEN name IN ('JavaScript', 'TypeScript', 'HTML', 'CSS') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Frontend' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Programming Languages'))
            WHEN name IN ('Java', 'Python', 'C#', 'PHP', 'Ruby', 'Go', 'Rust') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Backend' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Programming Languages'))
            WHEN name IN ('Swift', 'Kotlin', 'Objective-C', 'Dart') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Mobile' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Programming Languages'))
            ELSE 
                (SELECT id FROM skill_subcategories WHERE name = 'General Purpose' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Programming Languages'))
        END
    )
WHERE category ILIKE '%programming%' OR category ILIKE '%language%'
   OR name IN ('JavaScript', 'TypeScript', 'HTML', 'CSS', 'Java', 'Python', 'C#', 'PHP', 
               'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Objective-C', 'Dart', 'C', 'C++');

-- Update Frameworks skills
UPDATE skills 
SET 
    category_id = (SELECT id FROM skill_categories WHERE name = 'Frameworks'),
    subcategory_id = (
        CASE 
            WHEN name IN ('React', 'Angular', 'Vue.js', 'Svelte', 'Next.js') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Web Frontend' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Frameworks'))
            WHEN name IN ('Express', 'Django', 'Spring Boot', 'Laravel', 'Rails') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Web Backend' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Frameworks'))
            WHEN name IN ('React Native', 'Flutter', 'Xamarin') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Mobile' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Frameworks'))
            ELSE 
                (SELECT id FROM skill_subcategories WHERE name = 'Cross-platform' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Frameworks'))
        END
    )
WHERE category ILIKE '%framework%' OR category ILIKE '%library%'
   OR name IN ('React', 'Angular', 'Vue.js', 'Svelte', 'Next.js', 'Express', 'Django', 
               'Spring Boot', 'Laravel', 'Rails', 'React Native', 'Flutter', 'Xamarin');

-- Update Data Science skills
UPDATE skills 
SET 
    category_id = (SELECT id FROM skill_categories WHERE name = 'Data Science'),
    subcategory_id = (
        CASE 
            WHEN name IN ('TensorFlow', 'PyTorch', 'scikit-learn', 'Keras') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Machine Learning' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Data Science'))
            WHEN name IN ('Pandas', 'NumPy', 'R', 'SPSS', 'SAS') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Data Analysis' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Data Science'))
            WHEN name IN ('Tableau', 'Power BI', 'D3.js', 'Matplotlib', 'Seaborn') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Visualization' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Data Science'))
            ELSE 
                (SELECT id FROM skill_subcategories WHERE name = 'Big Data' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Data Science'))
        END
    )
WHERE category ILIKE '%data%' OR category ILIKE '%analytics%' OR category ILIKE '%machine learning%'
   OR name IN ('TensorFlow', 'PyTorch', 'scikit-learn', 'Keras', 'Pandas', 'NumPy', 'R', 
               'SPSS', 'SAS', 'Tableau', 'Power BI', 'D3.js', 'Matplotlib', 'Seaborn', 
               'Hadoop', 'Spark', 'Kafka', 'Cassandra', 'MongoDB');

-- Update DevOps skills
UPDATE skills 
SET 
    category_id = (SELECT id FROM skill_categories WHERE name = 'DevOps'),
    subcategory_id = (
        CASE 
            WHEN name IN ('Jenkins', 'GitHub Actions', 'Travis CI', 'CircleCI') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'CI/CD' AND category_id = (SELECT id FROM skill_categories WHERE name = 'DevOps'))
            WHEN name IN ('AWS', 'Azure', 'Google Cloud', 'Heroku', 'DigitalOcean') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Cloud' AND category_id = (SELECT id FROM skill_categories WHERE name = 'DevOps'))
            WHEN name IN ('Docker', 'Kubernetes', 'Helm', 'OpenShift') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Containerization' AND category_id = (SELECT id FROM skill_categories WHERE name = 'DevOps'))
            ELSE 
                (SELECT id FROM skill_subcategories WHERE name = 'Infrastructure' AND category_id = (SELECT id FROM skill_categories WHERE name = 'DevOps'))
        END
    )
WHERE category ILIKE '%devops%' OR category ILIKE '%operations%' OR category ILIKE '%infrastructure%'
   OR name IN ('Jenkins', 'GitHub Actions', 'Travis CI', 'CircleCI', 'AWS', 'Azure', 
               'Google Cloud', 'Heroku', 'DigitalOcean', 'Docker', 'Kubernetes', 'Helm', 
               'OpenShift', 'Terraform', 'Ansible', 'Puppet', 'Chef');

-- Update Design skills
UPDATE skills 
SET 
    category_id = (SELECT id FROM skill_categories WHERE name = 'Design'),
    subcategory_id = (
        CASE 
            WHEN name IN ('Sketch', 'Figma', 'Adobe XD', 'InVision') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'UI/UX' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Design'))
            WHEN name IN ('Photoshop', 'Illustrator', 'InDesign', 'GIMP') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Graphics' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Design'))
            WHEN name IN ('Balsamiq', 'Axure', 'Framer', 'Marvel') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Prototyping' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Design'))
            ELSE 
                (SELECT id FROM skill_subcategories WHERE name = 'Motion' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Design'))
        END
    )
WHERE category ILIKE '%design%' OR category ILIKE '%ui%' OR category ILIKE '%ux%'
   OR name IN ('Sketch', 'Figma', 'Adobe XD', 'InVision', 'Photoshop', 'Illustrator', 
               'InDesign', 'GIMP', 'Balsamiq', 'Axure', 'Framer', 'Marvel', 'After Effects', 
               'Premiere Pro', 'Final Cut Pro');

-- Update Soft Skills
UPDATE skills 
SET 
    category_id = (SELECT id FROM skill_categories WHERE name = 'Soft Skills'),
    subcategory_id = (
        CASE 
            WHEN name IN ('Public Speaking', 'Writing', 'Presentation', 'Technical Writing') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Communication' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Soft Skills'))
            WHEN name IN ('Team Management', 'Leadership', 'Mentoring', 'Coaching') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Leadership' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Soft Skills'))
            WHEN name IN ('Agile', 'Scrum', 'Kanban', 'Project Management', 'JIRA') THEN 
                (SELECT id FROM skill_subcategories WHERE name = 'Project Management' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Soft Skills'))
            ELSE 
                (SELECT id FROM skill_subcategories WHERE name = 'Collaboration' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Soft Skills'))
        END
    )
WHERE category ILIKE '%soft skill%' OR category ILIKE '%communication%' OR category ILIKE '%management%'
   OR name IN ('Public Speaking', 'Writing', 'Presentation', 'Technical Writing', 
               'Team Management', 'Leadership', 'Mentoring', 'Coaching', 'Agile', 'Scrum', 
               'Kanban', 'Project Management', 'JIRA', 'Teamwork', 'Collaboration', 'Conflict Resolution');

-- Update any remaining uncategorized skills to a default category and subcategory
UPDATE skills
SET 
    category_id = (SELECT id FROM skill_categories WHERE name = 'Programming Languages'),
    subcategory_id = (SELECT id FROM skill_subcategories WHERE name = 'General Purpose' AND category_id = (SELECT id FROM skill_categories WHERE name = 'Programming Languages'))
WHERE category_id IS NULL;