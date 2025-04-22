--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.clients VALUES (1, 'Acme Corporation', 'Technology', 'John Doe', 'john.doe@acme.com', '555-123-4567', 'https://acme.com', 'https://acme.com/logo.png', 'Leading technology provider', '2025-03-23 08:14:07.310965', '2025-03-23 08:14:07.310965');
INSERT INTO public.clients VALUES (3, 'Atyeti Internal', 'IT', NULL, NULL, NULL, 'https://www.atyeti.com', NULL, NULL, '2025-03-25 08:28:11.572591', '2025-03-25 08:28:11.572591');


--
-- Data for Name: skill_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.skill_categories VALUES (1, 'Programming', 'General programming languages and software development skills', 1, 'visible', '#3B82F6', 'code', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (2, 'Database', 'Database design, management, and query optimization skills', 2, 'visible', '#8B5CF6', 'database', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (3, 'Cloud', 'Cloud infrastructure, deployment, and management skills', 3, 'visible', '#22D3EE', 'cloud', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (4, 'DevOps', 'Automation, CI/CD, deployment, and infrastructure skills', 4, 'visible', '#F97316', 'terminal', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (5, 'API', 'API development, testing, and integration skills', 5, 'visible', '#10B981', 'server', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (6, 'Mobile Development', 'Mobile app development and platform-specific skills', 6, 'visible', '#06B6D4', 'cpu', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (7, 'Security', 'Information security, penetration testing, and secure coding', 7, 'visible', '#DC2626', 'shield', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (8, 'Data Science', 'Data analysis, machine learning, and statistics', 8, 'visible', '#8B5CF6', 'barChart', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (9, 'AI', 'Artificial intelligence, machine learning, and automation', 9, 'visible', '#EC4899', 'activity', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (10, 'UI', 'User interface design and interaction skills', 10, 'visible', '#F59E0B', 'zap', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (11, 'Design', 'Graphic design, branding, and creative skills', 11, 'visible', '#EC4899', 'box', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (12, 'Marketing', 'Digital marketing, analytics, and campaign skills', 12, 'visible', '#14B8A6', 'globe', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (13, 'Project Management', 'Project planning, coordination, and delivery skills', 13, 'visible', '#6366F1', 'barChart', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (14, 'Leadership', 'Team management, mentoring, and strategic planning', 14, 'visible', '#22C55E', 'activity', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');
INSERT INTO public.skill_categories VALUES (15, 'Communication', 'Written and verbal communication, presentation skills', 15, 'visible', '#3B82F6', 'zap', '2025-04-18 09:22:21.864153', '2025-04-18 09:22:21.864153');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, '', 'test@example.com', '', true, '2025-03-10 10:17:47.052222', '2025-03-10 10:17:47.052222', '', '', '', '', '');
INSERT INTO public.users VALUES (10, 'admin', 'admin@skillsplatform.com', '60f0ab7d2700d00c650e2c58ae0a16204922647caf98a581afff8f0c080c0c3b4201c856573834ef675535d7e466cbbb2b19fd3ca988b5f6694203ac5a2a5ab4.83b3107d001dbbb297c2d91faf1180ad', true, '2025-03-10 12:14:59.206325', '2025-03-10 12:14:59.206325', 'Admin', 'user', 'Skills Platform Updated 3', 'Administrator', 'Remote');
INSERT INTO public.users VALUES (44, 'kallie.considine', 'kallie_considine@hotmail.com', '3911fdbad5d30a6d9ca82213975bf33aa9798faabc94309b1379a1c4d6222486056aa7f7dd8a479e38ff6de1169d5f15d89d30f557382fda69d2be71f23c239c.ce908e3337858addc943ea374a2b0b47', false, '2025-03-10 15:04:33.875', '2025-03-10 15:04:33.875', '', '', '', '', '');
INSERT INTO public.users VALUES (45, 'delphia.mclaughlin', 'delphia_mclaughlin35@hotmail.com', 'f23e1dee854402e5167b4533edae14bacf9a2452a3034cfdca942c23571938c66cb494fe6cd2a47c41d3c1377d94cd7b31051f93a48706ac0aa31ab44d4d5073.5f3efa129c690cc93a7aa706e74a1cd0', false, '2025-03-10 15:04:33.953', '2025-03-10 15:04:33.953', '', '', '', '', '');
INSERT INTO public.users VALUES (46, 'nikolas.boyle-miller', 'nikolas.boyle-miller@hotmail.com', '26439dcb9e45ed390d21ee898a6092d0445141ae0d84185575049a5367b8ceae0693c67cb94812d472818fae61c8db0c5d29944c0b079d3f775000b7fff3fd2f.b0e01333b570a6bebe02c45d6f09dc6c', false, '2025-03-10 15:04:34.039', '2025-03-10 15:04:34.039', '', '', '', '', '');
INSERT INTO public.users VALUES (47, 'delfina.ebert', 'delfina.ebert@yahoo.com', '5db1312378f187e048b95d7a5e15202ddf1193064cf55625a176d887558c77c9f62d125d1a3de924f1d13189d67e43997803ae631b6b67bd93baf37740d9d51c.15ad3933bd492d89bcfea8c2d72d557b', false, '2025-03-10 15:04:34.116', '2025-03-10 15:04:34.116', '', '', '', '', '');
INSERT INTO public.users VALUES (48, 'cale.stracke', 'cale.stracke@yahoo.com', '3146bfd10fcdf3115a6a0dd9e200dfcf4556e619cbb77e412bf4719dd571a3c89ad45f72bcb48da7608f31b974f5e26e814051743133a153017dc757e7afb67e.5675c4a64d5fc9670389790423b4687f', false, '2025-03-10 15:04:34.195', '2025-03-10 15:04:34.195', '', '', '', '', '');
INSERT INTO public.users VALUES (49, 'alycia.gibson', 'alycia_gibson66@gmail.com', 'a656a0ede4cb97b77725e08f4a0955527ccd19f3e64faa04ff759ace4c7825efe0152b44654d2c6b80233f07c997b30573ce9882cd8c03fd465fb6f23948330d.9d7361715aedb1a5f9b0823377fb3d18', false, '2025-03-10 15:04:34.265', '2025-03-10 15:04:34.265', '', '', '', '', '');
INSERT INTO public.users VALUES (50, 'pete.stark', 'pete_stark71@hotmail.com', 'b41baf7abbdebec2605682fae157a2466581523d955cd9231953097fff6c2ac9f2f03b7942edbf3bfa9a6abc7ae923ca3539f3c6d25091cc2af0f41226f44bd0.34fd68db2192f9e7b018748f47aa22a8', false, '2025-03-10 15:04:34.334', '2025-03-10 15:04:34.334', '', '', '', '', '');
INSERT INTO public.users VALUES (51, 'alice.larson', 'alice_larson68@hotmail.com', '08b36ef5caf4c0a4f81b73ee5e45b8475983c019410fbd8cc39e5259379f3eb4006bf163500f26210cb44d3fc207fec2dbc559873c073157c8724eda0a73b1a9.608f33e32b3b41e2a49bb2ec6a6ad970', false, '2025-03-10 15:04:34.425', '2025-03-10 15:04:34.425', '', '', '', '', '');
INSERT INTO public.users VALUES (52, 'vernice.hammes', 'vernice_hammes12@hotmail.com', 'fa1929aee70c49bafd6875341d0b86718f19f8bbd899528752e4ab6c00decab06f2f4488320fe52f6ea9341511b2c321cffb317173f8fa544ff4ee34edc749ba.63f41bea1799aefaf71992939c126653', false, '2025-03-10 15:04:34.495', '2025-03-10 15:04:34.495', '', '', '', '', '');
INSERT INTO public.users VALUES (53, 'emiliano.moore', 'emiliano_moore16@gmail.com', '6b0aebfb6459a390d48b01c415063e558e04a84d9f80c464fa11868e8b959adde3192b4573e14573a994683f42fc6223494fba9d5a473698caf795b5fa016ae1.f2d0e954ed71341d2d8ef83b280d48c5', false, '2025-03-10 15:04:34.574', '2025-03-10 15:04:34.574', '', '', '', '', '');
INSERT INTO public.users VALUES (54, 'everett.heathcote', 'everett.heathcote@hotmail.com', 'e126b8cdd5086d05d0971843ef48dd417c4a8165ef61ab305c115f8553dd600d83bf38477fc03a1aaafc25250620162b28601e4a76daabfb6d49b4ead2efad69.fd8e3a63179df78046beb831889a0d9c', false, '2025-03-10 15:04:34.644', '2025-03-10 15:04:34.644', '', '', '', '', '');
INSERT INTO public.users VALUES (55, 'janick.quitzon', 'janick.quitzon10@gmail.com', '7ed56121a8fc37f37f17faf28d8a0ec833b8baa791c8614e061dfc5c4cb19583a5d8b94a24468745ee93135d85ad06bcefa1bae200a6d2e66c8d8b2d19d698f7.da0e1aba7cef446579b9de3b0ed102d7', false, '2025-03-10 15:04:34.714', '2025-03-10 15:04:34.714', '', '', '', '', '');
INSERT INTO public.users VALUES (56, 'nicklaus.krajcik', 'nicklaus_krajcik@yahoo.com', 'd3a75f300050eafb048fe681ac5d01fb89d33c439b446e15d5fe6efab1fb919b69e3e07de1a20d161e3ef9878c36938000c1fd797da72f75fe974f7721728564.d7b9dbd8b05d6f05d90dd873afd49b41', false, '2025-03-10 15:04:34.786', '2025-03-10 15:04:34.786', '', '', '', '', '');
INSERT INTO public.users VALUES (57, 'roma.harvey', 'roma_harvey@yahoo.com', '86f0ced8ce12853f55f4f92bbf4b823b8eefbf94c1ff6881d3dc4ad2591515d578ca572e236dff0d5daf30280f0b9e08993f4f45157777719ad5d9ddd81fb5f1.f5eab65ee3d8824dde76b7a8547181be', false, '2025-03-10 15:04:34.86', '2025-03-10 15:04:34.86', '', '', '', '', '');
INSERT INTO public.users VALUES (58, 'ernestina.weber', 'ernestina.weber@hotmail.com', 'c2c738904c1035893c5711347e3a0240eb3e7e87f6b358fa90bddd0f2290279dbc180211062e6ebecd9cc507148556b1e51911ba3ac485e6f4b02fabcb13938e.b54c64a2588e7c44ae98c25ad9ff08a8', false, '2025-03-10 15:04:34.93', '2025-03-10 15:04:34.93', '', '', '', '', '');
INSERT INTO public.users VALUES (59, 'alysha.shields-purdy', 'alysha_shields-purdy@gmail.com', 'c990f1d7a2a829357db835725c8f94723c4f6685de322eda08985d7450cb8466355d2511d2615053c98e1edb99c1f9509fa88128165361f162a838cbc176ac99.1ee6211134d463a0b84ff8209339b9ea', false, '2025-03-10 15:04:34.999', '2025-03-10 15:04:34.999', '', '', '', '', '');
INSERT INTO public.users VALUES (60, 'bertha.berge', 'bertha_berge@hotmail.com', '00cb0177f5dd56a0e347890d22e449def8232cdac6ce59442fb5535431cc5ded4e7934484a405936fa188e20741272f438ce6159193cd4eda15c96734ffe4853.accce3707642e43d06ba7b5978d6c7f2', false, '2025-03-10 15:04:35.067', '2025-03-10 15:04:35.067', '', '', '', '', '');
INSERT INTO public.users VALUES (61, 'mariano.vonrueden', 'mariano.vonrueden12@yahoo.com', '697f0e701e146f199a799826398064ac93f3c57239aaa0e9d798cc9834af61c0b0911c9c753d07d31f5202e639a9f0a44edc1bd64dfa4dfb8458bdf29d99d9c0.ad9b4dbda9c61508d22a228c2b998557', false, '2025-03-10 15:04:35.136', '2025-03-10 15:04:35.136', '', '', '', '', '');
INSERT INTO public.users VALUES (62, 'casimir.larson', 'casimir.larson@hotmail.com', '25bfa7a1a1c36cafbd08138e0f48621a4e5623071506fdaef71a2821a6cb3e6c3231045808ee99fcfa01e674e49ce7d214722d0091007285ef920085ed55e5e9.bd2d22ad63c0859c95c86a02f487478c', false, '2025-03-10 15:04:35.204', '2025-03-10 15:04:35.204', '', '', '', '', '');
INSERT INTO public.users VALUES (63, 'sofia.romaguera', 'sofia_romaguera@gmail.com', '8d770ff5c46cb550e1065e6f6d1cdfeb427def4131401f9847282d643eb7148815d684a6ca0835d7386e4eea72c00208aadc9dfd436c7ded00e9f376d38fce05.6547133d840b4cf26d5150fab7a10bcb', false, '2025-03-10 15:04:35.272', '2025-03-10 15:04:35.272', '', '', '', '', '');
INSERT INTO public.users VALUES (66, 'adminatyeti', 'admin@atyeti.com', '60f0ab7d2700d00c650e2c58ae0a16204922647caf98a581afff8f0c080c0c3b4201c856573834ef675535d7e466cbbb2b19fd3ca988b5f6694203ac5a2a5ab4.83b3107d001dbbb297c2d91faf1180ad', true, '2025-03-15 04:44:55.137757', '2025-03-15 04:44:55.137757', 'Admin', 'User', '', 'Administrator', '');
INSERT INTO public.users VALUES (68, 'test', 'test@atyeti.com', '392c2a2084649d9cbb0d9cdee63b0d86bde5800e074f1fb22bfb0e5ae79e9ae1616de73c9650a078bba8781b3163ed0508cfd6361a501067f033cedd36e5ebf0.7f6b9984c8734b7ff79d5e24413ffc75', false, '2025-03-15 05:00:26.648335', '2025-03-15 05:00:26.648335', '', '', '', '', '');
INSERT INTO public.users VALUES (70, 'newtest', 'newtest@atyeti.com', 'a43f0030558fc3dc832cb1547572220922e52a53744bd147834f330031e68701fafa03d944ca24bcc37fd6f06c8dab450730b385cdbbc105f745d74d9564fde1.f1f9894320afbad12ec1c848b0eb94c2', false, '2025-03-15 08:01:20.163254', '2025-03-15 08:01:20.163254', '', '', '', '', '');
INSERT INTO public.users VALUES (69, 'vinayak.chobe', 'vinayak.chobe@atyeti.com', '4e43069fd2f69e938872e54450d14d574d866c4a52101f93fe2b00b8767fe698a0665a0c4791e1fc77ce2f4d6486bc09a410792e652be9672599cb790ff07e51.0f552d38f466316309f5de545c462786', true, '2025-03-15 05:04:14.501458', '2025-03-15 05:04:14.501458', 'Vinayak', 'Chobe', 'Delivery', 'Head of Delivery', 'Pune');


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.skills VALUES (467, 66, 'Java', 'Programming', 'intermediate', '', '', '', 0, '2025-04-20 13:45:10.678645', '2025-04-20 13:45:10.678645', NULL, NULL, 1);
INSERT INTO public.skills VALUES (433, 44, 'Vue.js', 'UI', 'expert', 'Vue', '', '', 0, '2025-03-14 08:14:10.564236', '2025-03-14 08:14:10.564236', NULL, NULL, 10);
INSERT INTO public.skills VALUES (434, 10, 'Scala', 'Programming', 'beginner', '', '', 'Java on steroids', 0, '2025-03-14 17:28:55.891064', '2025-03-14 17:28:55.891064', NULL, NULL, 1);
INSERT INTO public.skills VALUES (435, 44, 'Scala', 'Programming', 'expert', '', '', 'Java on steroids', 0, '2025-03-14 20:51:57.098898', '2025-03-14 20:51:57.098898', NULL, NULL, 1);
INSERT INTO public.skills VALUES (437, 69, 'Scala', 'Programming', 'intermediate', 'SCJP', 'https://www.credly.com/badges/ac044ab3-527d-4065-823c-745872352af3/public_url', 'Java on steroids', 0, '2025-03-15 08:46:48.75703', '2025-03-15 08:46:48.75703', NULL, NULL, 1);
INSERT INTO public.skills VALUES (432, 10, 'GCP', 'Cloud', 'intermediate', 'Google Cloud Professional Cloud Architect', 'https://www.credly.com/badges/ac044ab3-527d-4065-823c-745872352af3/public_url', 'Vinayak Test entry for admin1', 0, '2025-03-18 09:25:57.860713', '2025-03-10 15:43:40.345741', NULL, NULL, 3);
INSERT INTO public.skills VALUES (438, 69, 'GCP', 'Cloud', 'expert', 'Professional Cloud Architect Certification', 'https://www.credly.com/badges/ac044ab3-527d-4065-823c-745872352af3/public_url', 'Professional Cloud Architect Certification
', 0, '2025-03-18 09:28:31.571196', '2025-03-15 10:28:40.435828', NULL, NULL, 3);
INSERT INTO public.skills VALUES (439, 69, 'JavaScript', 'Programming', 'beginner', '', '', '', 0, '2025-03-18 09:37:48.332444', '2025-03-18 09:37:29.740135', NULL, NULL, 1);
INSERT INTO public.skills VALUES (440, 10, 'Java', 'Programming', 'intermediate', 'Google Cloud Professional Cloud Architect', 'https://www.credly.com/badges/ac044ab3-527d-4065-823c-745872352af3/public_url', 'Java on steroids', 0, '2025-03-18 15:35:49.19971', '2025-03-18 15:35:49.19971', NULL, NULL, 1);
INSERT INTO public.skills VALUES (442, 69, 'Scala', 'Programming', 'expert', 'Google Cloud Professional Cloud Architect', 'https://www.credly.com/badges/ac044ab3-527d-4065-823c-745872352af3/public_url', 'Java on steroids', 0, '2025-03-18 16:23:07.850032', '2025-03-18 16:23:07.850032', NULL, NULL, 1);
INSERT INTO public.skills VALUES (445, 44, 'TypeScript', 'Programming', 'intermediate', 'TypeScript Certified Developer', 'https://credly.com/badges/abc123', 'Completed TypeScript certification course', 0, '2025-03-20 10:30:06.330454', '2025-03-20 10:30:06.330454', NULL, NULL, 1);
INSERT INTO public.skills VALUES (446, 10, 'Change Management', 'Leadership', 'beginner', '', '', '', 0, '2025-03-20 11:28:18.391806', '2025-03-20 11:28:18.391806', NULL, NULL, 14);
INSERT INTO public.skills VALUES (461, 54, 'Angular', 'UI', 'expert', 'Angular Expert', '', 'Empty certification date', 0, '2025-03-20 11:29:02.344522', '2025-03-20 11:29:02.344522', NULL, NULL, 10);
INSERT INTO public.skills VALUES (380, 58, 'Authentication', 'Security', 'expert', NULL, NULL, 'Experience with Authentication', 3, '2025-03-10 15:04:40.493', '2025-03-10 15:04:40.493', NULL, NULL, 7);
INSERT INTO public.skills VALUES (381, 58, 'PHP', 'Programming', 'beginner', NULL, NULL, 'Experience with PHP', 2, '2025-03-10 15:04:40.527', '2025-03-10 15:04:40.527', NULL, NULL, 1);
INSERT INTO public.skills VALUES (382, 59, 'Kubernetes', 'DevOps', 'intermediate', 'Salesforce CI/CD Expert', 'https://credly.com/badges/fv3fdslm', 'Experience with Kubernetes', 2, '2025-03-10 15:04:40.562', '2025-03-10 15:04:40.562', '2024-02-27 23:09:32.893', '2026-02-27 23:09:32.893', 4);
INSERT INTO public.skills VALUES (383, 59, 'Containerization', 'Cloud', 'beginner', 'IBM Cloud Security', 'https://credly.com/badges/e4yudrss', 'Experience with Containerization', 1, '2025-03-10 15:04:40.596', '2025-03-10 15:04:40.596', '2023-07-11 08:12:14.457', '2025-07-11 08:12:14.457', 3);
INSERT INTO public.skills VALUES (384, 59, 'Penetration Testing', 'Security', 'expert', NULL, NULL, 'Experience with Penetration Testing', 3, '2025-03-10 15:04:40.63', '2025-03-10 15:04:40.63', NULL, NULL, 7);
INSERT INTO public.skills VALUES (385, 59, 'R', 'Data Science', 'intermediate', NULL, NULL, 'Experience with R', 2, '2025-03-10 15:04:40.665', '2025-03-10 15:04:40.665', NULL, NULL, 8);
INSERT INTO public.skills VALUES (386, 59, 'Design Systems', 'Design', 'beginner', 'Oracle UX/UI Specialist', 'https://credly.com/badges/iib0l0sc', 'Experience with Design Systems', 1, '2025-03-10 15:04:40.699', '2025-03-10 15:04:40.699', '2023-09-08 14:03:44.169', '2025-09-08 14:03:44.169', 11);
INSERT INTO public.skills VALUES (387, 59, 'Data Visualization', 'Data Science', 'intermediate', NULL, NULL, 'Experience with Data Visualization', 3, '2025-03-10 15:04:40.733', '2025-03-10 15:04:40.733', NULL, NULL, 8);
INSERT INTO public.skills VALUES (388, 59, 'Data Visualization', 'Data Science', 'intermediate', NULL, NULL, 'Experience with Data Visualization', 2, '2025-03-10 15:04:40.767', '2025-03-10 15:04:40.767', NULL, NULL, 8);
INSERT INTO public.skills VALUES (389, 59, 'Security Auditing', 'Security', 'expert', NULL, NULL, 'Experience with Security Auditing', 3, '2025-03-10 15:04:40.801', '2025-03-10 15:04:40.801', NULL, NULL, 7);
INSERT INTO public.skills VALUES (390, 59, 'Network Security', 'Security', 'expert', NULL, NULL, 'Experience with Network Security', 4, '2025-03-10 15:04:40.835', '2025-03-10 15:04:40.835', NULL, NULL, 7);
INSERT INTO public.skills VALUES (391, 59, 'Git', 'DevOps', 'beginner', NULL, NULL, 'Experience with Git', 3, '2025-03-10 15:04:40.87', '2025-03-10 15:04:40.87', NULL, NULL, 4);
INSERT INTO public.skills VALUES (392, 60, 'IaC', 'Cloud', 'intermediate', 'Adobe Solutions Architect', 'https://credly.com/badges/ahcqdnys', 'Experience with IaC', 0, '2025-03-10 15:04:40.904', '2025-03-10 15:04:40.904', '2023-08-15 10:24:39.738', '2025-08-15 10:24:39.738', 3);
INSERT INTO public.skills VALUES (393, 60, 'Ad Campaigns', 'Marketing', 'beginner', 'AWS Content Strategy', 'https://credly.com/badges/ci7szis8', 'Experience with Ad Campaigns', 4, '2025-03-10 15:04:40.938', '2025-03-10 15:04:40.938', '2024-02-28 02:55:42.268', '2026-02-28 02:55:42.268', 12);
INSERT INTO public.skills VALUES (394, 60, 'Tableau', 'Data Science', 'beginner', NULL, NULL, 'Experience with Tableau', 4, '2025-03-10 15:04:40.972', '2025-03-10 15:04:40.972', NULL, NULL, 8);
INSERT INTO public.skills VALUES (395, 60, 'Budgeting', 'Project Management', 'beginner', NULL, NULL, 'Experience with Budgeting', 2, '2025-03-10 15:04:41.006', '2025-03-10 15:04:41.006', NULL, NULL, 13);
INSERT INTO public.skills VALUES (396, 60, 'R', 'Data Science', 'intermediate', NULL, NULL, 'Experience with R', 3, '2025-03-10 15:04:41.041', '2025-03-10 15:04:41.041', NULL, NULL, 8);
INSERT INTO public.skills VALUES (441, 69, 'AWS', 'Cloud', 'expert', 'AWS Architect', 'https://www.credly.com/badges/ac044ab3-527d-4065-823c-745872352af3/public_url', '', 0, '2025-03-18 15:44:22.016433', '2025-03-18 15:44:22.016433', NULL, NULL, 3);
INSERT INTO public.skills VALUES (443, 69, 'MongoDB', 'Database', 'intermediate', 'Mongo DB Certified Professional', 'https://www.credly.com/badges/ac044ab3-527d-4065-823c-745872352af3/public_url', '', 0, '2025-03-18 16:30:38.959817', '2025-03-18 16:30:38.959817', NULL, NULL, 2);
INSERT INTO public.skills VALUES (447, 10, 'Decision Making', 'Leadership', 'beginner', '', '', '', 0, '2025-03-20 11:28:21.531435', '2025-03-20 11:28:21.531435', NULL, NULL, 14);
INSERT INTO public.skills VALUES (449, 10, 'Git', 'DevOps', 'beginner', '', '', '', 0, '2025-03-20 11:28:23.198782', '2025-03-20 11:28:23.198782', NULL, NULL, 4);
INSERT INTO public.skills VALUES (462, 56, 'Terraform', 'DevOps', 'intermediate', 'Terraform Associate', '', 'No dates provided', 0, '2025-03-20 11:29:06.062025', '2025-03-20 11:29:06.062025', NULL, NULL, 4);
INSERT INTO public.skills VALUES (463, 53, 'Azure', 'Cloud', 'intermediate', 'Azure Administrator', '', 'Azure certification with no expiration', 0, '2025-03-20 11:29:14.493916', '2025-03-20 11:29:14.493916', NULL, NULL, 3);
INSERT INTO public.skills VALUES (397, 60, 'IaC', 'Cloud', 'intermediate', NULL, NULL, 'Experience with IaC', 1, '2025-03-10 15:04:41.075', '2025-03-10 15:04:41.075', NULL, NULL, 3);
INSERT INTO public.skills VALUES (398, 60, 'MS Project', 'Project Management', 'beginner', NULL, NULL, 'Experience with MS Project', 4, '2025-03-10 15:04:41.109', '2025-03-10 15:04:41.109', NULL, NULL, 13);
INSERT INTO public.skills VALUES (399, 60, 'Presentations', 'Communication', 'intermediate', NULL, NULL, 'Experience with Presentations', 2, '2025-03-10 15:04:41.144', '2025-03-10 15:04:41.144', NULL, NULL, 15);
INSERT INTO public.skills VALUES (400, 60, 'Machine Learning', 'Data Science', 'beginner', NULL, NULL, 'Experience with Machine Learning', 2, '2025-03-10 15:04:41.178', '2025-03-10 15:04:41.178', NULL, NULL, 8);
INSERT INTO public.skills VALUES (401, 60, 'Budgeting', 'Project Management', 'beginner', NULL, NULL, 'Experience with Budgeting', 0, '2025-03-10 15:04:41.212', '2025-03-10 15:04:41.212', NULL, NULL, 13);
INSERT INTO public.skills VALUES (402, 61, 'Network Security', 'Security', 'beginner', 'Salesforce Ethical Hacker', 'https://credly.com/badges/1rikw2wn', 'Experience with Network Security', 0, '2025-03-10 15:04:41.247', '2025-03-10 15:04:41.247', '2023-05-07 01:09:42.031', '2025-05-07 01:09:42.031', 7);
INSERT INTO public.skills VALUES (403, 61, 'Technical Writing', 'Communication', 'intermediate', 'Salesforce Business Communication', 'https://credly.com/badges/5utbijjp', 'Experience with Technical Writing', 1, '2025-03-10 15:04:41.282', '2025-03-10 15:04:41.282', '2023-12-08 06:24:57.55', '2025-12-08 06:24:57.55', 15);
INSERT INTO public.skills VALUES (404, 61, 'MS Project', 'Project Management', 'beginner', NULL, NULL, 'Experience with MS Project', 3, '2025-03-10 15:04:41.317', '2025-03-10 15:04:41.317', NULL, NULL, 13);
INSERT INTO public.skills VALUES (405, 61, 'Python', 'Programming', 'intermediate', NULL, NULL, 'Experience with Python', 1, '2025-03-10 15:04:41.351', '2025-03-10 15:04:41.351', NULL, NULL, 1);
INSERT INTO public.skills VALUES (406, 61, 'Java', 'Programming', 'intermediate', NULL, NULL, 'Experience with Java', 3, '2025-03-10 15:04:41.385', '2025-03-10 15:04:41.385', NULL, NULL, 1);
INSERT INTO public.skills VALUES (407, 61, 'PHP', 'Programming', 'beginner', NULL, NULL, 'Experience with PHP', 4, '2025-03-10 15:04:41.419', '2025-03-10 15:04:41.419', NULL, NULL, 1);
INSERT INTO public.skills VALUES (408, 61, 'Public Speaking', 'Communication', 'intermediate', NULL, NULL, 'Experience with Public Speaking', 3, '2025-03-10 15:04:41.454', '2025-03-10 15:04:41.454', NULL, NULL, 15);
INSERT INTO public.skills VALUES (409, 61, 'Git', 'DevOps', 'beginner', NULL, NULL, 'Experience with Git', 2, '2025-03-10 15:04:41.51', '2025-03-10 15:04:41.51', NULL, NULL, 4);
INSERT INTO public.skills VALUES (410, 61, 'Presentations', 'Communication', 'expert', NULL, NULL, 'Experience with Presentations', 2, '2025-03-10 15:04:41.544', '2025-03-10 15:04:41.544', NULL, NULL, 15);
INSERT INTO public.skills VALUES (411, 61, 'Python', 'Programming', 'beginner', NULL, NULL, 'Experience with Python', 0, '2025-03-10 15:04:41.578', '2025-03-10 15:04:41.578', NULL, NULL, 1);
INSERT INTO public.skills VALUES (412, 62, 'Java', 'Programming', 'beginner', 'AWS Certified Developer', 'https://credly.com/badges/vyorxbhm', 'Experience with Java', 4, '2025-03-10 15:04:41.612', '2025-03-10 15:04:41.612', '2023-09-04 03:54:40.786', '2025-09-04 03:54:40.786', 1);
INSERT INTO public.skills VALUES (413, 62, 'C#', 'Programming', 'intermediate', 'RedHat Programming Expert', 'https://credly.com/badges/9dcagfhh', 'Experience with C#', 4, '2025-03-10 15:04:41.647', '2025-03-10 15:04:41.647', '2024-02-12 11:57:07.694', '2026-02-12 11:57:07.694', 1);
INSERT INTO public.skills VALUES (414, 62, 'Ruby', 'Programming', 'beginner', NULL, NULL, 'Experience with Ruby', 1, '2025-03-10 15:04:41.681', '2025-03-10 15:04:41.681', NULL, NULL, 1);
INSERT INTO public.skills VALUES (415, 62, 'Sketch', 'Design', 'beginner', 'Google UX/UI Specialist', 'https://credly.com/badges/wzn0fzr7', 'Experience with Sketch', 0, '2025-03-10 15:04:41.715', '2025-03-10 15:04:41.715', '2023-04-29 10:41:44.773', '2025-04-29 10:41:44.773', 11);
INSERT INTO public.skills VALUES (416, 62, 'Ad Campaigns', 'Marketing', 'beginner', NULL, NULL, 'Experience with Ad Campaigns', 1, '2025-03-10 15:04:41.749', '2025-03-10 15:04:41.749', NULL, NULL, 12);
INSERT INTO public.skills VALUES (417, 62, 'ELK Stack', 'DevOps', 'beginner', 'Google Infrastructure Automation', 'https://credly.com/badges/f4ykhpgb', 'Experience with ELK Stack', 2, '2025-03-10 15:04:41.783', '2025-03-10 15:04:41.783', '2023-12-09 09:28:02.098', '2025-12-09 09:28:02.098', 4);
INSERT INTO public.skills VALUES (418, 62, 'TypeScript', 'Programming', 'intermediate', NULL, NULL, 'Experience with TypeScript', 4, '2025-03-10 15:04:41.817', '2025-03-10 15:04:41.817', NULL, NULL, 1);
INSERT INTO public.skills VALUES (419, 62, 'AWS', 'Cloud', 'beginner', NULL, NULL, 'Experience with AWS', 2, '2025-03-10 15:04:41.852', '2025-03-10 15:04:41.852', NULL, NULL, 3);
INSERT INTO public.skills VALUES (420, 62, 'GCP', 'Cloud', 'intermediate', NULL, NULL, 'Experience with GCP', 3, '2025-03-10 15:04:41.887', '2025-03-10 15:04:41.887', NULL, NULL, 3);
INSERT INTO public.skills VALUES (421, 62, 'Containerization', 'Cloud', 'beginner', NULL, NULL, 'Experience with Containerization', 4, '2025-03-10 15:04:41.923', '2025-03-10 15:04:41.923', NULL, NULL, 3);
INSERT INTO public.skills VALUES (422, 63, 'Statistics', 'Data Science', 'intermediate', 'Adobe Analytics Professional', 'https://credly.com/badges/dz8tamrf', 'Experience with Statistics', 1, '2025-03-10 15:04:41.958', '2025-03-10 15:04:41.958', '2023-07-13 03:32:43.467', '2025-07-13 03:32:43.467', 8);
INSERT INTO public.skills VALUES (456, 50, 'GraphQL', 'API', 'intermediate', '', '', 'GraphQL course completed', 0, '2025-03-20 11:28:41.954373', '2025-03-20 11:28:41.954373', NULL, NULL, 5);
INSERT INTO public.skills VALUES (423, 63, 'Cloud Architecture', 'Cloud', 'beginner', 'CompTIA Cloud Security', 'https://credly.com/badges/ib68hwso', 'Experience with Cloud Architecture', 4, '2025-03-10 15:04:41.992', '2025-03-10 15:04:41.992', '2023-05-22 10:59:08.85', '2025-05-22 10:59:08.85', 3);
INSERT INTO public.skills VALUES (424, 63, 'Python', 'Data Science', 'intermediate', NULL, NULL, 'Experience with Python', 2, '2025-03-10 15:04:42.026', '2025-03-10 15:04:42.026', NULL, NULL, 8);
INSERT INTO public.skills VALUES (425, 63, 'Security Auditing', 'Security', 'expert', NULL, NULL, 'Experience with Security Auditing', 1, '2025-03-10 15:04:42.06', '2025-03-10 15:04:42.06', NULL, NULL, 7);
INSERT INTO public.skills VALUES (426, 63, 'TypeScript', 'Programming', 'expert', NULL, NULL, 'Experience with TypeScript', 2, '2025-03-10 15:04:42.094', '2025-03-10 15:04:42.094', NULL, NULL, 1);
INSERT INTO public.skills VALUES (427, 63, 'SQL', 'Data Science', 'intermediate', 'IBM ML Expert', 'https://credly.com/badges/io5ioo36', 'Experience with SQL', 3, '2025-03-10 15:04:42.129', '2025-03-10 15:04:42.129', '2023-09-22 18:42:29.331', '2025-09-22 18:42:29.331', 8);
INSERT INTO public.skills VALUES (428, 63, 'GCP', 'Cloud', 'intermediate', NULL, NULL, 'Experience with GCP', 1, '2025-03-10 15:04:42.163', '2025-03-10 15:04:42.163', NULL, NULL, 3);
INSERT INTO public.skills VALUES (429, 63, 'Python', 'Data Science', 'expert', NULL, NULL, 'Experience with Python', 3, '2025-03-10 15:04:42.197', '2025-03-10 15:04:42.197', NULL, NULL, 8);
INSERT INTO public.skills VALUES (430, 63, 'Cloud Architecture', 'Cloud', 'expert', NULL, NULL, 'Experience with Cloud Architecture', 0, '2025-03-10 15:04:42.232', '2025-03-10 15:04:42.232', NULL, NULL, 3);
INSERT INTO public.skills VALUES (431, 63, 'Cloud Architecture', 'Cloud', 'beginner', NULL, NULL, 'Experience with Cloud Architecture', 3, '2025-03-10 15:04:42.266', '2025-03-10 15:04:42.266', NULL, NULL, 3);
INSERT INTO public.skills VALUES (457, 46, 'Docker', 'DevOps', 'intermediate', 'Docker Certified Associate', 'https://credly.com/badges/def456', 'Completed Docker training', 0, '2025-03-20 11:28:48.679591', '2025-03-20 11:28:48.679591', NULL, NULL, 4);
INSERT INTO public.skills VALUES (444, 69, 'Express.js', 'UI', 'intermediate', '', '', '', 0, '2025-03-18 16:30:41.033559', '2025-03-18 16:30:41.033559', NULL, NULL, 10);
INSERT INTO public.skills VALUES (448, 10, 'Sketch', 'Design', 'beginner', '', '', '', 0, '2025-03-20 11:28:22.30498', '2025-03-20 11:28:22.30498', NULL, NULL, 11);
INSERT INTO public.skills VALUES (450, 10, 'Design Systems', 'Design', 'beginner', '', '', '', 0, '2025-03-20 11:28:24.626419', '2025-03-20 11:28:24.626419', NULL, NULL, 11);
INSERT INTO public.skills VALUES (464, 55, 'Swift', 'Mobile Development', 'beginner', 'iOS Development', '', 'Expired certification', 0, '2025-03-20 11:29:17.864434', '2025-03-20 11:29:17.864434', NULL, NULL, 6);
INSERT INTO public.skills VALUES (466, 10, 'Terraform', 'DevOps', 'beginner', '', '', 'Updated Terraform', 0, '2025-04-18 06:44:16.035496', '2025-04-16 19:32:56.091319', NULL, NULL, 4);
INSERT INTO public.skills VALUES (246, 45, 'Authentication', 'Security', 'intermediate', NULL, NULL, 'Experience with Authentication', 3, '2025-03-10 15:04:35.855', '2025-03-10 15:04:35.855', NULL, NULL, 7);
INSERT INTO public.skills VALUES (247, 45, 'Python', 'Data Science', 'intermediate', NULL, NULL, 'Experience with Python', 2, '2025-03-10 15:04:35.89', '2025-03-10 15:04:35.89', NULL, NULL, 8);
INSERT INTO public.skills VALUES (248, 45, 'Python', 'Data Science', 'intermediate', NULL, NULL, 'Experience with Python', 0, '2025-03-10 15:04:35.923', '2025-03-10 15:04:35.923', NULL, NULL, 8);
INSERT INTO public.skills VALUES (249, 45, 'JavaScript', 'Programming', 'beginner', NULL, NULL, 'Experience with JavaScript', 1, '2025-03-10 15:04:35.957', '2025-03-10 15:04:35.957', NULL, NULL, 1);
INSERT INTO public.skills VALUES (250, 45, 'TypeScript', 'Programming', 'beginner', NULL, NULL, 'Experience with TypeScript', 3, '2025-03-10 15:04:35.992', '2025-03-10 15:04:35.992', NULL, NULL, 1);
INSERT INTO public.skills VALUES (251, 45, 'UX Research', 'Design', 'beginner', NULL, NULL, 'Experience with UX Research', 3, '2025-03-10 15:04:36.026', '2025-03-10 15:04:36.026', NULL, NULL, 11);
INSERT INTO public.skills VALUES (252, 46, 'Email Marketing', 'Marketing', 'expert', 'Google SEO Expert', 'https://credly.com/badges/xcmcjayx', 'Experience with Email Marketing', 4, '2025-03-10 15:04:36.061', '2025-03-10 15:04:36.061', '2023-10-20 00:19:14.857', '2025-10-20 00:19:14.857', 12);
INSERT INTO public.skills VALUES (253, 46, 'Negotiation', 'Communication', 'intermediate', 'Oracle Public Speaking', 'https://credly.com/badges/pmisfmni', 'Experience with Negotiation', 3, '2025-03-10 15:04:36.095', '2025-03-10 15:04:36.095', '2023-03-24 03:44:39.4', '2025-03-24 03:44:39.4', 15);
INSERT INTO public.skills VALUES (254, 46, 'Email Marketing', 'Marketing', 'beginner', NULL, NULL, 'Experience with Email Marketing', 2, '2025-03-10 15:04:36.129', '2025-03-10 15:04:36.129', NULL, NULL, 12);
INSERT INTO public.skills VALUES (255, 46, 'Team Leadership', 'Leadership', 'expert', NULL, NULL, 'Experience with Team Leadership', 0, '2025-03-10 15:04:36.163', '2025-03-10 15:04:36.163', NULL, NULL, 14);
INSERT INTO public.skills VALUES (256, 46, 'Coaching', 'Leadership', 'intermediate', NULL, NULL, 'Experience with Coaching', 3, '2025-03-10 15:04:36.197', '2025-03-10 15:04:36.197', NULL, NULL, 14);
INSERT INTO public.skills VALUES (257, 46, 'Presentations', 'Communication', 'intermediate', NULL, NULL, 'Experience with Presentations', 1, '2025-03-10 15:04:36.231', '2025-03-10 15:04:36.231', NULL, NULL, 15);
INSERT INTO public.skills VALUES (258, 46, 'Ad Campaigns', 'Marketing', 'beginner', 'Adobe Content Strategy', 'https://credly.com/badges/sgxycidk', 'Experience with Ad Campaigns', 0, '2025-03-10 15:04:36.265', '2025-03-10 15:04:36.265', '2024-02-20 15:18:02.839', '2026-02-20 15:18:02.839', 12);
INSERT INTO public.skills VALUES (259, 46, 'Machine Learning', 'Data Science', 'expert', 'CompTIA ML Expert', 'https://credly.com/badges/8pggaa5p', 'Experience with Machine Learning', 2, '2025-03-10 15:04:36.299', '2025-03-10 15:04:36.299', '2023-03-30 03:04:39.531', '2025-03-30 03:04:39.531', 8);
INSERT INTO public.skills VALUES (260, 46, 'Email Marketing', 'Marketing', 'intermediate', NULL, NULL, 'Experience with Email Marketing', 2, '2025-03-10 15:04:36.333', '2025-03-10 15:04:36.333', NULL, NULL, 12);
INSERT INTO public.skills VALUES (261, 46, 'Presentations', 'Communication', 'expert', NULL, NULL, 'Experience with Presentations', 2, '2025-03-10 15:04:36.368', '2025-03-10 15:04:36.368', NULL, NULL, 15);
INSERT INTO public.skills VALUES (262, 47, 'CRM', 'Marketing', 'beginner', 'IBM Content Strategy', 'https://credly.com/badges/zow78gxo', 'Experience with CRM', 0, '2025-03-10 15:04:36.402', '2025-03-10 15:04:36.402', '2023-03-30 03:08:16.195', '2025-03-30 03:08:16.195', 12);
INSERT INTO public.skills VALUES (263, 47, 'Python', 'Data Science', 'beginner', 'Cisco Data Scientist', 'https://credly.com/badges/nrexi2ow', 'Experience with Python', 0, '2025-03-10 15:04:36.437', '2025-03-10 15:04:36.437', '2023-08-02 00:31:11.962', '2025-08-02 00:31:11.962', 8);
INSERT INTO public.skills VALUES (264, 47, 'GCP', 'Cloud', 'beginner', NULL, NULL, 'Experience with GCP', 2, '2025-03-10 15:04:36.471', '2025-03-10 15:04:36.471', NULL, NULL, 3);
INSERT INTO public.skills VALUES (265, 47, 'R', 'Data Science', 'intermediate', NULL, NULL, 'Experience with R', 4, '2025-03-10 15:04:36.505', '2025-03-10 15:04:36.505', NULL, NULL, 8);
INSERT INTO public.skills VALUES (266, 47, 'MS Project', 'Project Management', 'beginner', NULL, NULL, 'Experience with MS Project', 1, '2025-03-10 15:04:36.539', '2025-03-10 15:04:36.539', NULL, NULL, 13);
INSERT INTO public.skills VALUES (267, 47, 'SEO', 'Marketing', 'intermediate', NULL, NULL, 'Experience with SEO', 4, '2025-03-10 15:04:36.573', '2025-03-10 15:04:36.573', NULL, NULL, 12);
INSERT INTO public.skills VALUES (268, 47, 'SQL', 'Data Science', 'intermediate', NULL, NULL, 'Experience with SQL', 3, '2025-03-10 15:04:36.607', '2025-03-10 15:04:36.607', NULL, NULL, 8);
INSERT INTO public.skills VALUES (269, 47, 'Strategic Planning', 'Leadership', 'beginner', NULL, NULL, 'Experience with Strategic Planning', 4, '2025-03-10 15:04:36.641', '2025-03-10 15:04:36.641', NULL, NULL, 14);
INSERT INTO public.skills VALUES (270, 47, 'Machine Learning', 'Data Science', 'intermediate', NULL, NULL, 'Experience with Machine Learning', 4, '2025-03-10 15:04:36.676', '2025-03-10 15:04:36.676', NULL, NULL, 8);
INSERT INTO public.skills VALUES (271, 47, 'AWS', 'Cloud', 'beginner', NULL, NULL, 'Experience with AWS', 2, '2025-03-10 15:04:36.71', '2025-03-10 15:04:36.71', NULL, NULL, 3);
INSERT INTO public.skills VALUES (272, 48, 'UX Research', 'Design', 'expert', 'Microsoft Visual Design Professional', 'https://credly.com/badges/doo8mcds', 'Experience with UX Research', 2, '2025-03-10 15:04:36.744', '2025-03-10 15:04:36.744', '2023-12-21 16:03:48.698', '2025-12-21 16:03:48.698', 11);
INSERT INTO public.skills VALUES (273, 48, 'Sketch', 'Design', 'beginner', 'CompTIA Design Systems Expert', 'https://credly.com/badges/qr0duawj', 'Experience with Sketch', 0, '2025-03-10 15:04:36.778', '2025-03-10 15:04:36.778', '2023-03-24 21:24:30.911', '2025-03-24 21:24:30.911', 11);
INSERT INTO public.skills VALUES (274, 48, 'UX Research', 'Design', 'beginner', NULL, NULL, 'Experience with UX Research', 1, '2025-03-10 15:04:36.813', '2025-03-10 15:04:36.813', NULL, NULL, 11);
INSERT INTO public.skills VALUES (275, 48, 'GCP', 'Cloud', 'intermediate', NULL, NULL, 'Experience with GCP', 0, '2025-03-10 15:04:36.849', '2025-03-10 15:04:36.849', NULL, NULL, 3);
INSERT INTO public.skills VALUES (276, 48, 'Serverless', 'Cloud', 'expert', 'Adobe Cloud Security', 'https://credly.com/badges/s5f3cavu', 'Experience with Serverless', 4, '2025-03-10 15:04:36.883', '2025-03-10 15:04:36.883', '2023-10-12 18:40:12.673', '2025-10-12 18:40:12.673', 3);
INSERT INTO public.skills VALUES (277, 48, 'UX Research', 'Design', 'intermediate', 'AWS UX/UI Specialist', 'https://credly.com/badges/wqd5abmi', 'Experience with UX Research', 2, '2025-03-10 15:04:36.917', '2025-03-10 15:04:36.917', '2023-10-10 00:14:33.675', '2025-10-10 00:14:33.675', 11);
INSERT INTO public.skills VALUES (278, 48, 'Risk Management', 'Project Management', 'beginner', NULL, NULL, 'Experience with Risk Management', 2, '2025-03-10 15:04:36.952', '2025-03-10 15:04:36.952', NULL, NULL, 13);
INSERT INTO public.skills VALUES (279, 48, 'Decision Making', 'Leadership', 'beginner', 'IBM Team Leadership', 'https://credly.com/badges/c4veb7r7', 'Experience with Decision Making', 3, '2025-03-10 15:04:36.989', '2025-03-10 15:04:36.989', '2023-11-24 05:47:30.375', '2025-11-24 05:47:30.375', 14);
INSERT INTO public.skills VALUES (280, 48, 'Risk Management', 'Project Management', 'intermediate', NULL, NULL, 'Experience with Risk Management', 2, '2025-03-10 15:04:37.023', '2025-03-10 15:04:37.023', NULL, NULL, 13);
INSERT INTO public.skills VALUES (281, 48, 'Presentations', 'Communication', 'intermediate', NULL, NULL, 'Experience with Presentations', 4, '2025-03-10 15:04:37.057', '2025-03-10 15:04:37.057', NULL, NULL, 15);
INSERT INTO public.skills VALUES (282, 49, 'Terraform', 'DevOps', 'intermediate', 'Oracle DevOps Professional', 'https://credly.com/badges/gtento9j', 'Experience with Terraform', 2, '2025-03-10 15:04:37.091', '2025-03-10 15:04:37.091', '2023-05-08 05:11:29.409', '2025-05-08 05:11:29.409', 4);
INSERT INTO public.skills VALUES (283, 49, 'Client Communication', 'Communication', 'beginner', 'Oracle Technical Writing', 'https://credly.com/badges/cajjuidv', 'Experience with Client Communication', 2, '2025-03-10 15:04:37.125', '2025-03-10 15:04:37.125', '2023-04-16 19:22:29.834', '2025-04-16 19:22:29.834', 15);
INSERT INTO public.skills VALUES (284, 49, 'IaC', 'Cloud', 'intermediate', NULL, NULL, 'Experience with IaC', 2, '2025-03-10 15:04:37.159', '2025-03-10 15:04:37.159', NULL, NULL, 3);
INSERT INTO public.skills VALUES (285, 49, 'Ansible', 'DevOps', 'intermediate', NULL, NULL, 'Experience with Ansible', 4, '2025-03-10 15:04:37.193', '2025-03-10 15:04:37.193', NULL, NULL, 4);
INSERT INTO public.skills VALUES (286, 49, 'IaC', 'Cloud', 'intermediate', NULL, NULL, 'Experience with IaC', 2, '2025-03-10 15:04:37.228', '2025-03-10 15:04:37.228', NULL, NULL, 3);
INSERT INTO public.skills VALUES (287, 49, 'R', 'Data Science', 'intermediate', NULL, NULL, 'Experience with R', 0, '2025-03-10 15:04:37.262', '2025-03-10 15:04:37.262', NULL, NULL, 8);
INSERT INTO public.skills VALUES (288, 49, 'Social Media', 'Marketing', 'intermediate', NULL, NULL, 'Experience with Social Media', 0, '2025-03-10 15:04:37.297', '2025-03-10 15:04:37.297', NULL, NULL, 12);
INSERT INTO public.skills VALUES (289, 49, 'CI/CD', 'DevOps', 'beginner', NULL, NULL, 'Experience with CI/CD', 4, '2025-03-10 15:04:37.333', '2025-03-10 15:04:37.333', NULL, NULL, 4);
INSERT INTO public.skills VALUES (451, 10, 'TypeScript', 'Programming', 'intermediate', '', '', '', 0, '2025-03-20 11:28:26.590956', '2025-03-20 11:28:26.590956', NULL, NULL, 1);
INSERT INTO public.skills VALUES (455, 48, 'AWS', 'Cloud', 'beginner', '', '', 'Starting AWS learning path', 0, '2025-03-20 11:28:38.923492', '2025-03-20 11:28:38.923492', NULL, NULL, 3);
INSERT INTO public.skills VALUES (290, 49, 'Public Speaking', 'Communication', 'beginner', NULL, NULL, 'Experience with Public Speaking', 2, '2025-03-10 15:04:37.368', '2025-03-10 15:04:37.368', NULL, NULL, 15);
INSERT INTO public.skills VALUES (291, 49, 'CRM', 'Marketing', 'beginner', NULL, NULL, 'Experience with CRM', 0, '2025-03-10 15:04:37.403', '2025-03-10 15:04:37.403', NULL, NULL, 12);
INSERT INTO public.skills VALUES (292, 50, 'Cloud Architecture', 'Cloud', 'beginner', 'Microsoft Cloud Architect', 'https://credly.com/badges/scbxgxuj', 'Experience with Cloud Architecture', 4, '2025-03-10 15:04:37.439', '2025-03-10 15:04:37.439', '2023-11-19 02:12:54.294', '2025-11-19 02:12:54.294', 3);
INSERT INTO public.skills VALUES (293, 50, 'Cloud Architecture', 'Cloud', 'expert', 'IBM Cloud Architect', 'https://credly.com/badges/hkiwwc9d', 'Experience with Cloud Architecture', 4, '2025-03-10 15:04:37.473', '2025-03-10 15:04:37.473', '2023-07-11 06:56:04.086', '2025-07-11 06:56:04.086', 3);
INSERT INTO public.skills VALUES (294, 50, 'Kubernetes', 'DevOps', 'beginner', NULL, NULL, 'Experience with Kubernetes', 1, '2025-03-10 15:04:37.507', '2025-03-10 15:04:37.507', NULL, NULL, 4);
INSERT INTO public.skills VALUES (295, 50, 'Presentations', 'Communication', 'expert', NULL, NULL, 'Experience with Presentations', 0, '2025-03-10 15:04:37.541', '2025-03-10 15:04:37.541', NULL, NULL, 15);
INSERT INTO public.skills VALUES (296, 50, 'Scrum', 'Project Management', 'beginner', NULL, NULL, 'Experience with Scrum', 3, '2025-03-10 15:04:37.58', '2025-03-10 15:04:37.58', NULL, NULL, 13);
INSERT INTO public.skills VALUES (297, 50, 'Serverless', 'Cloud', 'expert', 'Adobe Solutions Architect', 'https://credly.com/badges/wj7zql9p', 'Experience with Serverless', 0, '2025-03-10 15:04:37.616', '2025-03-10 15:04:37.616', '2024-01-31 03:55:08.771', '2026-01-31 03:55:08.771', 3);
INSERT INTO public.skills VALUES (298, 50, 'Public Speaking', 'Communication', 'expert', NULL, NULL, 'Experience with Public Speaking', 3, '2025-03-10 15:04:37.654', '2025-03-10 15:04:37.654', NULL, NULL, 15);
INSERT INTO public.skills VALUES (299, 50, 'Ansible', 'DevOps', 'intermediate', NULL, NULL, 'Experience with Ansible', 4, '2025-03-10 15:04:37.689', '2025-03-10 15:04:37.689', NULL, NULL, 4);
INSERT INTO public.skills VALUES (300, 50, 'Risk Management', 'Project Management', 'intermediate', NULL, NULL, 'Experience with Risk Management', 2, '2025-03-10 15:04:37.723', '2025-03-10 15:04:37.723', NULL, NULL, 13);
INSERT INTO public.skills VALUES (301, 50, 'Serverless', 'Cloud', 'beginner', 'Adobe Solutions Architect', 'https://credly.com/badges/uxvdgydl', 'Experience with Serverless', 2, '2025-03-10 15:04:37.757', '2025-03-10 15:04:37.757', '2023-03-22 07:27:48.026', '2025-03-22 07:27:48.026', 3);
INSERT INTO public.skills VALUES (302, 51, 'IaC', 'Cloud', 'beginner', 'Google Cloud Architect', 'https://credly.com/badges/858pmtrc', 'Experience with IaC', 4, '2025-03-10 15:04:37.792', '2025-03-10 15:04:37.792', '2023-12-03 17:14:57.038', '2025-12-03 17:14:57.038', 3);
INSERT INTO public.skills VALUES (303, 51, 'Encryption', 'Security', 'intermediate', 'IBM Ethical Hacker', 'https://credly.com/badges/wffujvdq', 'Experience with Encryption', 3, '2025-03-10 15:04:37.826', '2025-03-10 15:04:37.826', '2023-08-27 00:45:08.196', '2025-08-27 00:45:08.196', 7);
INSERT INTO public.skills VALUES (304, 51, 'GCP', 'Cloud', 'expert', NULL, NULL, 'Experience with GCP', 4, '2025-03-10 15:04:37.862', '2025-03-10 15:04:37.862', NULL, NULL, 3);
INSERT INTO public.skills VALUES (305, 51, 'Client Communication', 'Communication', 'beginner', 'Salesforce Technical Writing', 'https://credly.com/badges/b1fcjtkm', 'Experience with Client Communication', 2, '2025-03-10 15:04:37.897', '2025-03-10 15:04:37.897', '2023-12-29 03:44:52.12', '2025-12-29 03:44:52.12', 15);
INSERT INTO public.skills VALUES (306, 51, 'Scrum', 'Project Management', 'intermediate', NULL, NULL, 'Experience with Scrum', 0, '2025-03-10 15:04:37.931', '2025-03-10 15:04:37.931', NULL, NULL, 13);
INSERT INTO public.skills VALUES (307, 51, 'Presentations', 'Communication', 'intermediate', 'Adobe Public Speaking', 'https://credly.com/badges/oac0zuih', 'Experience with Presentations', 1, '2025-03-10 15:04:37.965', '2025-03-10 15:04:37.965', '2023-06-23 03:58:09.126', '2025-06-23 03:58:09.126', 15);
INSERT INTO public.skills VALUES (308, 51, 'Risk Management', 'Project Management', 'expert', NULL, NULL, 'Experience with Risk Management', 0, '2025-03-10 15:04:38', '2025-03-10 15:04:38', NULL, NULL, 13);
INSERT INTO public.skills VALUES (309, 51, 'Negotiation', 'Communication', 'intermediate', NULL, NULL, 'Experience with Negotiation', 0, '2025-03-10 15:04:38.034', '2025-03-10 15:04:38.034', NULL, NULL, 15);
INSERT INTO public.skills VALUES (310, 51, 'Authentication', 'Security', 'beginner', NULL, NULL, 'Experience with Authentication', 0, '2025-03-10 15:04:38.068', '2025-03-10 15:04:38.068', NULL, NULL, 7);
INSERT INTO public.skills VALUES (311, 51, 'Risk Management', 'Project Management', 'beginner', NULL, NULL, 'Experience with Risk Management', 0, '2025-03-10 15:04:38.103', '2025-03-10 15:04:38.103', NULL, NULL, 13);
INSERT INTO public.skills VALUES (312, 52, 'Serverless', 'Cloud', 'beginner', 'Salesforce Solutions Architect', 'https://credly.com/badges/cpts0sp7', 'Experience with Serverless', 2, '2025-03-10 15:04:38.137', '2025-03-10 15:04:38.137', '2023-10-30 23:19:51.595', '2025-10-30 23:19:51.595', 3);
INSERT INTO public.skills VALUES (313, 52, 'JIRA', 'Project Management', 'expert', 'CompTIA Scrum Master', 'https://credly.com/badges/xuwjt940', 'Experience with JIRA', 4, '2025-03-10 15:04:38.172', '2025-03-10 15:04:38.172', '2023-05-24 07:16:44.114', '2025-05-24 07:16:44.114', 13);
INSERT INTO public.skills VALUES (314, 52, 'Serverless', 'Cloud', 'intermediate', NULL, NULL, 'Experience with Serverless', 1, '2025-03-10 15:04:38.206', '2025-03-10 15:04:38.206', NULL, NULL, 3);
INSERT INTO public.skills VALUES (315, 52, 'Security Auditing', 'Security', 'intermediate', NULL, NULL, 'Experience with Security Auditing', 0, '2025-03-10 15:04:38.241', '2025-03-10 15:04:38.241', NULL, NULL, 7);
INSERT INTO public.skills VALUES (316, 52, 'MS Project', 'Project Management', 'expert', 'CompTIA Scrum Master', 'https://credly.com/badges/dlke1oi5', 'Experience with MS Project', 1, '2025-03-10 15:04:38.276', '2025-03-10 15:04:38.276', '2023-07-03 17:21:01.572', '2025-07-03 17:21:01.572', 13);
INSERT INTO public.skills VALUES (317, 52, 'R', 'Data Science', 'beginner', NULL, NULL, 'Experience with R', 4, '2025-03-10 15:04:38.31', '2025-03-10 15:04:38.31', NULL, NULL, 8);
INSERT INTO public.skills VALUES (318, 52, 'Git', 'DevOps', 'beginner', NULL, NULL, 'Experience with Git', 4, '2025-03-10 15:04:38.345', '2025-03-10 15:04:38.345', NULL, NULL, 4);
INSERT INTO public.skills VALUES (319, 52, 'Scrum', 'Project Management', 'beginner', NULL, NULL, 'Experience with Scrum', 3, '2025-03-10 15:04:38.379', '2025-03-10 15:04:38.379', NULL, NULL, 13);
INSERT INTO public.skills VALUES (320, 52, 'IaC', 'Cloud', 'beginner', NULL, NULL, 'Experience with IaC', 3, '2025-03-10 15:04:38.419', '2025-03-10 15:04:38.419', NULL, NULL, 3);
INSERT INTO public.skills VALUES (321, 52, 'SQL', 'Data Science', 'beginner', NULL, NULL, 'Experience with SQL', 3, '2025-03-10 15:04:38.453', '2025-03-10 15:04:38.453', NULL, NULL, 8);
INSERT INTO public.skills VALUES (322, 53, 'Public Speaking', 'Communication', 'beginner', 'Microsoft Public Speaking', 'https://credly.com/badges/saey7bxp', 'Experience with Public Speaking', 4, '2025-03-10 15:04:38.488', '2025-03-10 15:04:38.488', '2023-06-04 09:21:36.692', '2025-06-04 09:21:36.692', 15);
INSERT INTO public.skills VALUES (323, 53, 'CRM', 'Marketing', 'beginner', 'RedHat SEO Expert', 'https://credly.com/badges/akc6ieud', 'Experience with CRM', 2, '2025-03-10 15:04:38.526', '2025-03-10 15:04:38.526', '2023-07-13 16:47:26.077', '2025-07-13 16:47:26.077', 12);
INSERT INTO public.skills VALUES (324, 53, 'ELK Stack', 'DevOps', 'beginner', NULL, NULL, 'Experience with ELK Stack', 4, '2025-03-10 15:04:38.561', '2025-03-10 15:04:38.561', NULL, NULL, 4);
INSERT INTO public.skills VALUES (325, 53, 'Change Management', 'Leadership', 'intermediate', 'Salesforce Leadership Excellence', 'https://credly.com/badges/n6nin21m', 'Experience with Change Management', 4, '2025-03-10 15:04:38.595', '2025-03-10 15:04:38.595', '2024-01-06 19:28:49.275', '2026-01-06 19:28:49.275', 14);
INSERT INTO public.skills VALUES (326, 53, 'Public Speaking', 'Communication', 'expert', NULL, NULL, 'Experience with Public Speaking', 1, '2025-03-10 15:04:38.631', '2025-03-10 15:04:38.631', NULL, NULL, 15);
INSERT INTO public.skills VALUES (327, 53, 'Terraform', 'DevOps', 'expert', 'AWS CI/CD Expert', 'https://credly.com/badges/zny9ijgp', 'Experience with Terraform', 0, '2025-03-10 15:04:38.669', '2025-03-10 15:04:38.669', '2023-08-02 06:22:59.124', '2025-08-02 06:22:59.124', 4);
INSERT INTO public.skills VALUES (328, 53, 'Team Leadership', 'Leadership', 'expert', NULL, NULL, 'Experience with Team Leadership', 3, '2025-03-10 15:04:38.705', '2025-03-10 15:04:38.705', NULL, NULL, 14);
INSERT INTO public.skills VALUES (329, 53, 'Negotiation', 'Communication', 'beginner', NULL, NULL, 'Experience with Negotiation', 1, '2025-03-10 15:04:38.739', '2025-03-10 15:04:38.739', NULL, NULL, 15);
INSERT INTO public.skills VALUES (330, 53, 'GCP', 'Cloud', 'intermediate', 'Cisco Cloud Architect', 'https://credly.com/badges/lapwydzj', 'Experience with GCP', 0, '2025-03-10 15:04:38.774', '2025-03-10 15:04:38.774', '2024-02-17 05:19:22.429', '2026-02-17 05:19:22.429', 3);
INSERT INTO public.skills VALUES (331, 53, 'Social Media', 'Marketing', 'intermediate', NULL, NULL, 'Experience with Social Media', 2, '2025-03-10 15:04:38.809', '2025-03-10 15:04:38.809', NULL, NULL, 12);
INSERT INTO public.skills VALUES (332, 54, 'MS Project', 'Project Management', 'beginner', 'RedHat Scrum Master', 'https://credly.com/badges/hd9ls75u', 'Experience with MS Project', 4, '2025-03-10 15:04:38.843', '2025-03-10 15:04:38.843', '2023-11-12 23:42:25.565', '2025-11-12 23:42:25.565', 13);
INSERT INTO public.skills VALUES (333, 54, 'Negotiation', 'Communication', 'beginner', 'AWS Technical Writing', 'https://credly.com/badges/vebncmsr', 'Experience with Negotiation', 3, '2025-03-10 15:04:38.878', '2025-03-10 15:04:38.878', '2023-11-02 16:29:19.43', '2025-11-02 16:29:19.43', 15);
INSERT INTO public.skills VALUES (334, 54, 'Technical Writing', 'Communication', 'beginner', NULL, NULL, 'Experience with Technical Writing', 1, '2025-03-10 15:04:38.912', '2025-03-10 15:04:38.912', NULL, NULL, 15);
INSERT INTO public.skills VALUES (335, 54, 'Security Auditing', 'Security', 'intermediate', 'Adobe Security Professional', 'https://credly.com/badges/b0kop3s1', 'Experience with Security Auditing', 1, '2025-03-10 15:04:38.947', '2025-03-10 15:04:38.947', '2024-03-04 15:00:01.62', '2026-03-04 15:00:01.62', 7);
INSERT INTO public.skills VALUES (336, 54, 'Strategic Planning', 'Leadership', 'beginner', 'Oracle Team Leadership', 'https://credly.com/badges/hif34wfx', 'Experience with Strategic Planning', 3, '2025-03-10 15:04:38.981', '2025-03-10 15:04:38.981', '2023-12-25 11:54:51.934', '2025-12-25 11:54:51.934', 14);
INSERT INTO public.skills VALUES (471, 44, 'Java', 'Programming', 'expert', '', '', '', 0, '2025-04-21 14:52:22.000202', '2025-04-21 14:52:22.000202', NULL, NULL, 1);
INSERT INTO public.skills VALUES (452, 10, 'ELK Stack', 'DevOps', 'beginner', '', '', '', 0, '2025-03-20 11:28:29.000914', '2025-03-20 11:28:29.000914', NULL, NULL, 4);
INSERT INTO public.skills VALUES (453, 45, 'React Native', 'Mobile Development', 'beginner', '', '', 'Started learning React Native', 0, '2025-03-20 11:28:32.471023', '2025-03-20 11:28:32.471023', NULL, NULL, 6);
INSERT INTO public.skills VALUES (454, 47, 'Python', 'Programming', 'expert', 'Python Professional Certification', 'https://credly.com/badges/ghi789', 'Advanced Python programming training', 0, '2025-03-20 11:28:36.142088', '2025-03-20 11:28:36.142088', NULL, NULL, 1);
INSERT INTO public.skills VALUES (458, 51, 'MongoDB', 'Database', 'beginner', '', '', 'MongoDB training course', 0, '2025-03-20 11:28:51.864576', '2025-03-20 11:28:51.864576', NULL, NULL, 2);
INSERT INTO public.skills VALUES (459, 49, 'Kubernetes', 'DevOps', 'beginner', '', '', 'Learning Kubernetes basics', 0, '2025-03-20 11:28:54.896309', '2025-03-20 11:28:54.896309', NULL, NULL, 4);
INSERT INTO public.skills VALUES (460, 52, 'Machine Learning', 'AI', 'beginner', '', '', 'Starting ML course', 0, '2025-03-20 11:28:58.435562', '2025-03-20 11:28:58.435562', NULL, NULL, 9);
INSERT INTO public.skills VALUES (232, 44, 'Penetration Testing', 'Security', 'intermediate', 'Microsoft Security+', 'https://credly.com/badges/tjpqnxjy', 'Experience with Penetration Testing', 1, '2025-03-10 15:04:35.307', '2025-03-10 15:04:35.307', '2024-02-08 04:59:13.288', '2026-02-08 04:59:13.288', 7);
INSERT INTO public.skills VALUES (233, 44, 'Decision Making', 'Leadership', 'beginner', 'CompTIA Team Leadership', 'https://credly.com/badges/gbd5jjpz', 'Experience with Decision Making', 4, '2025-03-10 15:04:35.341', '2025-03-10 15:04:35.341', '2024-02-17 02:02:25.971', '2026-02-17 02:02:25.971', 14);
INSERT INTO public.skills VALUES (234, 44, 'Adobe XD', 'Design', 'expert', NULL, NULL, 'Experience with Adobe XD', 0, '2025-03-10 15:04:35.376', '2025-03-10 15:04:35.376', NULL, NULL, 11);
INSERT INTO public.skills VALUES (235, 44, 'Security Auditing', 'Security', 'beginner', NULL, NULL, 'Experience with Security Auditing', 1, '2025-03-10 15:04:35.411', '2025-03-10 15:04:35.411', NULL, NULL, 7);
INSERT INTO public.skills VALUES (236, 44, 'Network Security', 'Security', 'intermediate', NULL, NULL, 'Experience with Network Security', 1, '2025-03-10 15:04:35.446', '2025-03-10 15:04:35.446', NULL, NULL, 7);
INSERT INTO public.skills VALUES (237, 44, 'Public Speaking', 'Communication', 'intermediate', NULL, NULL, 'Experience with Public Speaking', 4, '2025-03-10 15:04:35.48', '2025-03-10 15:04:35.48', NULL, NULL, 15);
INSERT INTO public.skills VALUES (238, 44, 'Figma', 'Design', 'intermediate', NULL, NULL, 'Experience with Figma', 1, '2025-03-10 15:04:35.582', '2025-03-10 15:04:35.582', NULL, NULL, 11);
INSERT INTO public.skills VALUES (239, 44, 'Decision Making', 'Leadership', 'intermediate', NULL, NULL, 'Experience with Decision Making', 1, '2025-03-10 15:04:35.617', '2025-03-10 15:04:35.617', NULL, NULL, 14);
INSERT INTO public.skills VALUES (240, 44, 'Negotiation', 'Communication', 'intermediate', 'AWS Business Communication', 'https://credly.com/badges/xif1ud6e', 'Experience with Negotiation', 1, '2025-03-10 15:04:35.651', '2025-03-10 15:04:35.651', '2023-09-11 07:13:51.742', '2025-09-11 07:13:51.742', 15);
INSERT INTO public.skills VALUES (241, 44, 'C#', 'Programming', 'intermediate', NULL, NULL, 'Experience with C#', 0, '2025-03-10 15:04:35.685', '2025-03-10 15:04:35.685', NULL, NULL, 1);
INSERT INTO public.skills VALUES (242, 45, 'Network Security', 'Security', 'expert', 'Oracle Security+', 'https://credly.com/badges/2ioccmub', 'Experience with Network Security', 0, '2025-03-10 15:04:35.719', '2025-03-10 15:04:35.719', '2023-10-17 17:27:50.257', '2025-10-17 17:27:50.257', 7);
INSERT INTO public.skills VALUES (243, 45, 'JIRA', 'Project Management', 'intermediate', 'AWS Agile Coach', 'https://credly.com/badges/ki7mfjw8', 'Experience with JIRA', 4, '2025-03-10 15:04:35.753', '2025-03-10 15:04:35.753', '2024-01-05 04:17:33.831', '2026-01-05 04:17:33.831', 13);
INSERT INTO public.skills VALUES (244, 45, 'PHP', 'Programming', 'expert', NULL, NULL, 'Experience with PHP', 2, '2025-03-10 15:04:35.787', '2025-03-10 15:04:35.787', NULL, NULL, 1);
INSERT INTO public.skills VALUES (245, 45, 'Authentication', 'Security', 'expert', NULL, NULL, 'Experience with Authentication', 0, '2025-03-10 15:04:35.821', '2025-03-10 15:04:35.821', NULL, NULL, 7);
INSERT INTO public.skills VALUES (337, 54, 'Coaching', 'Leadership', 'expert', 'RedHat Leadership Excellence', 'https://credly.com/badges/zxwfljrj', 'Experience with Coaching', 4, '2025-03-10 15:04:39.015', '2025-03-10 15:04:39.015', '2023-12-01 02:19:41.901', '2025-12-01 02:19:41.901', 14);
INSERT INTO public.skills VALUES (338, 54, 'Encryption', 'Security', 'intermediate', NULL, NULL, 'Experience with Encryption', 0, '2025-03-10 15:04:39.051', '2025-03-10 15:04:39.051', NULL, NULL, 7);
INSERT INTO public.skills VALUES (339, 54, 'Public Speaking', 'Communication', 'beginner', NULL, NULL, 'Experience with Public Speaking', 3, '2025-03-10 15:04:39.085', '2025-03-10 15:04:39.085', NULL, NULL, 15);
INSERT INTO public.skills VALUES (340, 54, 'Risk Management', 'Project Management', 'beginner', NULL, NULL, 'Experience with Risk Management', 2, '2025-03-10 15:04:39.119', '2025-03-10 15:04:39.119', NULL, NULL, 13);
INSERT INTO public.skills VALUES (341, 54, 'Encryption', 'Security', 'intermediate', NULL, NULL, 'Experience with Encryption', 4, '2025-03-10 15:04:39.153', '2025-03-10 15:04:39.153', NULL, NULL, 7);
INSERT INTO public.skills VALUES (342, 55, 'CRM', 'Marketing', 'intermediate', 'AWS Digital Marketing', 'https://credly.com/badges/11zevnnu', 'Experience with CRM', 4, '2025-03-10 15:04:39.188', '2025-03-10 15:04:39.188', '2023-08-14 23:51:43.466', '2025-08-14 23:51:43.466', 12);
INSERT INTO public.skills VALUES (343, 55, 'Security Auditing', 'Security', 'beginner', 'RedHat Security+', 'https://credly.com/badges/lzi3plhg', 'Experience with Security Auditing', 2, '2025-03-10 15:04:39.222', '2025-03-10 15:04:39.222', '2024-01-21 20:32:59.867', '2026-01-21 20:32:59.867', 7);
INSERT INTO public.skills VALUES (344, 55, 'SEO', 'Marketing', 'intermediate', NULL, NULL, 'Experience with SEO', 4, '2025-03-10 15:04:39.256', '2025-03-10 15:04:39.256', NULL, NULL, 12);
INSERT INTO public.skills VALUES (345, 55, 'GCP', 'Cloud', 'intermediate', NULL, NULL, 'Experience with GCP', 4, '2025-03-10 15:04:39.29', '2025-03-10 15:04:39.29', NULL, NULL, 3);
INSERT INTO public.skills VALUES (346, 55, 'C#', 'Programming', 'expert', NULL, NULL, 'Experience with C#', 3, '2025-03-10 15:04:39.324', '2025-03-10 15:04:39.324', NULL, NULL, 1);
INSERT INTO public.skills VALUES (347, 55, 'IaC', 'Cloud', 'beginner', NULL, NULL, 'Experience with IaC', 0, '2025-03-10 15:04:39.358', '2025-03-10 15:04:39.358', NULL, NULL, 3);
INSERT INTO public.skills VALUES (348, 55, 'Rust', 'Programming', 'intermediate', 'IBM Code Professional', 'https://credly.com/badges/mt8dkav6', 'Experience with Rust', 1, '2025-03-10 15:04:39.393', '2025-03-10 15:04:39.393', '2024-03-03 07:34:38.328', '2026-03-03 07:34:38.328', 1);
INSERT INTO public.skills VALUES (349, 55, 'SEO', 'Marketing', 'beginner', NULL, NULL, 'Experience with SEO', 3, '2025-03-10 15:04:39.427', '2025-03-10 15:04:39.427', NULL, NULL, 12);
INSERT INTO public.skills VALUES (350, 55, 'Coaching', 'Leadership', 'intermediate', NULL, NULL, 'Experience with Coaching', 2, '2025-03-10 15:04:39.461', '2025-03-10 15:04:39.461', NULL, NULL, 14);
INSERT INTO public.skills VALUES (351, 55, 'Social Media', 'Marketing', 'beginner', NULL, NULL, 'Experience with Social Media', 2, '2025-03-10 15:04:39.495', '2025-03-10 15:04:39.495', NULL, NULL, 12);
INSERT INTO public.skills VALUES (352, 56, 'Java', 'Programming', 'intermediate', 'CompTIA Code Professional', 'https://credly.com/badges/bhofwejd', 'Experience with Java', 1, '2025-03-10 15:04:39.531', '2025-03-10 15:04:39.531', '2023-06-27 08:11:49.41', '2025-06-27 08:11:49.41', 1);
INSERT INTO public.skills VALUES (353, 56, 'Ruby', 'Programming', 'beginner', 'Salesforce Code Professional', 'https://credly.com/badges/ap5ankpw', 'Experience with Ruby', 1, '2025-03-10 15:04:39.565', '2025-03-10 15:04:39.565', '2024-01-18 11:33:37.425', '2026-01-18 11:33:37.425', 1);
INSERT INTO public.skills VALUES (354, 56, 'Analytics', 'Marketing', 'beginner', NULL, NULL, 'Experience with Analytics', 4, '2025-03-10 15:04:39.599', '2025-03-10 15:04:39.599', NULL, NULL, 12);
INSERT INTO public.skills VALUES (355, 56, 'Data Visualization', 'Data Science', 'intermediate', NULL, NULL, 'Experience with Data Visualization', 3, '2025-03-10 15:04:39.634', '2025-03-10 15:04:39.634', NULL, NULL, 8);
INSERT INTO public.skills VALUES (356, 56, 'Presentations', 'Communication', 'expert', NULL, NULL, 'Experience with Presentations', 1, '2025-03-10 15:04:39.668', '2025-03-10 15:04:39.668', NULL, NULL, 15);
INSERT INTO public.skills VALUES (357, 56, 'Statistics', 'Data Science', 'expert', NULL, NULL, 'Experience with Statistics', 1, '2025-03-10 15:04:39.702', '2025-03-10 15:04:39.702', NULL, NULL, 8);
INSERT INTO public.skills VALUES (358, 56, 'Negotiation', 'Communication', 'beginner', NULL, NULL, 'Experience with Negotiation', 4, '2025-03-10 15:04:39.737', '2025-03-10 15:04:39.737', NULL, NULL, 15);
INSERT INTO public.skills VALUES (359, 56, 'C#', 'Programming', 'expert', 'Salesforce Programming Expert', 'https://credly.com/badges/7dwzv6xf', 'Experience with C#', 2, '2025-03-10 15:04:39.771', '2025-03-10 15:04:39.771', '2023-07-26 05:56:10.277', '2025-07-26 05:56:10.277', 1);
INSERT INTO public.skills VALUES (360, 56, 'Client Communication', 'Communication', 'intermediate', 'Microsoft Business Communication', 'https://credly.com/badges/6ukry4iu', 'Experience with Client Communication', 4, '2025-03-10 15:04:39.805', '2025-03-10 15:04:39.805', '2023-03-15 02:13:42.536', '2025-03-15 02:13:42.536', 15);
INSERT INTO public.skills VALUES (361, 56, 'Ad Campaigns', 'Marketing', 'intermediate', NULL, NULL, 'Experience with Ad Campaigns', 0, '2025-03-10 15:04:39.839', '2025-03-10 15:04:39.839', NULL, NULL, 12);
INSERT INTO public.skills VALUES (362, 57, 'Strategic Planning', 'Leadership', 'expert', 'IBM Team Leadership', 'https://credly.com/badges/sv1ftqey', 'Experience with Strategic Planning', 2, '2025-03-10 15:04:39.874', '2025-03-10 15:04:39.874', '2023-11-24 19:15:41.843', '2025-11-24 19:15:41.843', 14);
INSERT INTO public.skills VALUES (363, 57, 'BigQuery', 'Data Science', 'expert', 'RedHat Data Scientist', 'https://credly.com/badges/ajkhdisd', 'Experience with BigQuery', 0, '2025-03-10 15:04:39.908', '2025-03-10 15:04:39.908', '2024-01-07 16:06:12.129', '2026-01-07 16:06:12.129', 8);
INSERT INTO public.skills VALUES (364, 57, 'Illustrator', 'Design', 'beginner', NULL, NULL, 'Experience with Illustrator', 1, '2025-03-10 15:04:39.942', '2025-03-10 15:04:39.942', NULL, NULL, 11);
INSERT INTO public.skills VALUES (365, 57, 'Strategic Planning', 'Leadership', 'expert', NULL, NULL, 'Experience with Strategic Planning', 1, '2025-03-10 15:04:39.976', '2025-03-10 15:04:39.976', NULL, NULL, 14);
INSERT INTO public.skills VALUES (366, 57, 'Strategic Planning', 'Leadership', 'expert', NULL, NULL, 'Experience with Strategic Planning', 4, '2025-03-10 15:04:40.01', '2025-03-10 15:04:40.01', NULL, NULL, 14);
INSERT INTO public.skills VALUES (367, 57, 'Adobe XD', 'Design', 'intermediate', NULL, NULL, 'Experience with Adobe XD', 3, '2025-03-10 15:04:40.045', '2025-03-10 15:04:40.045', NULL, NULL, 11);
INSERT INTO public.skills VALUES (368, 57, 'Email Marketing', 'Marketing', 'beginner', NULL, NULL, 'Experience with Email Marketing', 0, '2025-03-10 15:04:40.079', '2025-03-10 15:04:40.079', NULL, NULL, 12);
INSERT INTO public.skills VALUES (369, 57, 'Change Management', 'Leadership', 'beginner', NULL, NULL, 'Experience with Change Management', 1, '2025-03-10 15:04:40.114', '2025-03-10 15:04:40.114', NULL, NULL, 14);
INSERT INTO public.skills VALUES (370, 57, 'Photoshop', 'Design', 'intermediate', NULL, NULL, 'Experience with Photoshop', 2, '2025-03-10 15:04:40.149', '2025-03-10 15:04:40.149', NULL, NULL, 11);
INSERT INTO public.skills VALUES (371, 57, 'Decision Making', 'Leadership', 'intermediate', NULL, NULL, 'Experience with Decision Making', 2, '2025-03-10 15:04:40.183', '2025-03-10 15:04:40.183', NULL, NULL, 14);
INSERT INTO public.skills VALUES (372, 58, 'Analytics', 'Marketing', 'beginner', 'AWS SEO Expert', 'https://credly.com/badges/076jyjcf', 'Experience with Analytics', 1, '2025-03-10 15:04:40.217', '2025-03-10 15:04:40.217', '2023-03-23 02:58:45.86', '2025-03-23 02:58:45.86', 12);
INSERT INTO public.skills VALUES (373, 58, 'GCP', 'Cloud', 'intermediate', 'Microsoft Cloud Security', 'https://credly.com/badges/kofirvha', 'Experience with GCP', 3, '2025-03-10 15:04:40.251', '2025-03-10 15:04:40.251', '2023-05-04 23:28:13.162', '2025-05-04 23:28:13.162', 3);
INSERT INTO public.skills VALUES (374, 58, 'Penetration Testing', 'Security', 'beginner', NULL, NULL, 'Experience with Penetration Testing', 2, '2025-03-10 15:04:40.287', '2025-03-10 15:04:40.287', NULL, NULL, 7);
INSERT INTO public.skills VALUES (375, 58, 'Illustrator', 'Design', 'beginner', NULL, NULL, 'Experience with Illustrator', 3, '2025-03-10 15:04:40.321', '2025-03-10 15:04:40.321', NULL, NULL, 11);
INSERT INTO public.skills VALUES (376, 58, 'Encryption', 'Security', 'intermediate', NULL, NULL, 'Experience with Encryption', 0, '2025-03-10 15:04:40.355', '2025-03-10 15:04:40.355', NULL, NULL, 7);
INSERT INTO public.skills VALUES (377, 58, 'Authentication', 'Security', 'intermediate', 'CompTIA Security Professional', 'https://credly.com/badges/xzrru6gt', 'Experience with Authentication', 0, '2025-03-10 15:04:40.39', '2025-03-10 15:04:40.39', '2023-08-28 16:04:40.737', '2025-08-28 16:04:40.737', 7);
INSERT INTO public.skills VALUES (378, 58, 'Penetration Testing', 'Security', 'beginner', NULL, NULL, 'Experience with Penetration Testing', 1, '2025-03-10 15:04:40.424', '2025-03-10 15:04:40.424', NULL, NULL, 7);
INSERT INTO public.skills VALUES (379, 58, 'UX Research', 'Design', 'intermediate', NULL, NULL, 'Experience with UX Research', 4, '2025-03-10 15:04:40.458', '2025-03-10 15:04:40.458', NULL, NULL, 11);


--
-- Data for Name: endorsements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications VALUES (7, 44, 'achievement', 'Your skill "TypeScript" has been approved!', false, 445, 10, '2025-03-20 10:30:06.330454');
INSERT INTO public.notifications VALUES (8, 44, 'achievement', 'Your skill TypeScript has been approved', false, 445, NULL, '2025-03-20 10:30:06.591555');
INSERT INTO public.notifications VALUES (9, 10, 'achievement', 'Your skill "Change Management" has been approved!', false, 446, 10, '2025-03-20 11:28:18.391806');
INSERT INTO public.notifications VALUES (10, 10, 'achievement', 'Your skill Change Management has been approved', false, 446, NULL, '2025-03-20 11:28:18.676429');
INSERT INTO public.notifications VALUES (11, 10, 'achievement', 'Your skill "Decision Making" has been approved!', false, 447, 10, '2025-03-20 11:28:21.531435');
INSERT INTO public.notifications VALUES (12, 10, 'achievement', 'Your skill Decision Making has been approved', false, 447, NULL, '2025-03-20 11:28:21.784394');
INSERT INTO public.notifications VALUES (13, 10, 'achievement', 'Your skill "Sketch" has been approved!', false, 448, 10, '2025-03-20 11:28:22.30498');
INSERT INTO public.notifications VALUES (14, 10, 'achievement', 'Your skill Sketch has been approved', false, 448, NULL, '2025-03-20 11:28:22.575584');
INSERT INTO public.notifications VALUES (15, 10, 'achievement', 'Your skill "Git" has been approved!', false, 449, 10, '2025-03-20 11:28:23.198782');
INSERT INTO public.notifications VALUES (16, 10, 'achievement', 'Your skill Git has been approved', false, 449, NULL, '2025-03-20 11:28:23.447518');
INSERT INTO public.notifications VALUES (17, 10, 'achievement', 'Your skill "Design Systems" has been approved!', false, 450, 10, '2025-03-20 11:28:24.626419');
INSERT INTO public.notifications VALUES (18, 10, 'achievement', 'Your skill Design Systems has been approved', false, 450, NULL, '2025-03-20 11:28:24.885622');
INSERT INTO public.notifications VALUES (19, 10, 'achievement', 'Your skill "TypeScript" has been approved!', false, 451, 10, '2025-03-20 11:28:26.590956');
INSERT INTO public.notifications VALUES (20, 10, 'achievement', 'Your skill TypeScript has been approved', false, 451, NULL, '2025-03-20 11:28:26.84664');
INSERT INTO public.notifications VALUES (21, 10, 'achievement', 'Your skill "ELK Stack" has been approved!', false, 452, 10, '2025-03-20 11:28:29.000914');
INSERT INTO public.notifications VALUES (22, 10, 'achievement', 'Your skill ELK Stack has been approved', false, 452, NULL, '2025-03-20 11:28:29.263392');
INSERT INTO public.notifications VALUES (23, 45, 'achievement', 'Your skill "React Native" has been approved!', false, 453, 10, '2025-03-20 11:28:32.471023');
INSERT INTO public.notifications VALUES (24, 45, 'achievement', 'Your skill React Native has been approved', false, 453, NULL, '2025-03-20 11:28:32.730421');
INSERT INTO public.notifications VALUES (25, 47, 'achievement', 'Your skill "Python" has been approved!', false, 454, 10, '2025-03-20 11:28:36.142088');
INSERT INTO public.notifications VALUES (26, 47, 'achievement', 'Your skill Python has been approved', false, 454, NULL, '2025-03-20 11:28:36.401982');
INSERT INTO public.notifications VALUES (27, 48, 'achievement', 'Your skill "AWS" has been approved!', false, 455, 10, '2025-03-20 11:28:38.923492');
INSERT INTO public.notifications VALUES (28, 48, 'achievement', 'Your skill AWS has been approved', false, 455, NULL, '2025-03-20 11:28:39.182243');
INSERT INTO public.notifications VALUES (29, 50, 'achievement', 'Your skill "GraphQL" has been approved!', false, 456, 10, '2025-03-20 11:28:41.954373');
INSERT INTO public.notifications VALUES (30, 50, 'achievement', 'Your skill GraphQL has been approved', false, 456, NULL, '2025-03-20 11:28:42.217569');
INSERT INTO public.notifications VALUES (31, 46, 'achievement', 'Your skill "Docker" has been approved!', false, 457, 10, '2025-03-20 11:28:48.679591');
INSERT INTO public.notifications VALUES (32, 46, 'achievement', 'Your skill Docker has been approved', false, 457, NULL, '2025-03-20 11:28:48.945111');
INSERT INTO public.notifications VALUES (33, 51, 'achievement', 'Your skill "MongoDB" has been approved!', false, 458, 10, '2025-03-20 11:28:51.864576');
INSERT INTO public.notifications VALUES (34, 51, 'achievement', 'Your skill MongoDB has been approved', false, 458, NULL, '2025-03-20 11:28:52.123978');
INSERT INTO public.notifications VALUES (35, 49, 'achievement', 'Your skill "Kubernetes" has been approved!', false, 459, 10, '2025-03-20 11:28:54.896309');
INSERT INTO public.notifications VALUES (36, 49, 'achievement', 'Your skill Kubernetes has been approved', false, 459, NULL, '2025-03-20 11:28:55.156026');
INSERT INTO public.notifications VALUES (37, 52, 'achievement', 'Your skill "Machine Learning" has been approved!', false, 460, 10, '2025-03-20 11:28:58.435562');
INSERT INTO public.notifications VALUES (38, 52, 'achievement', 'Your skill Machine Learning has been approved', false, 460, NULL, '2025-03-20 11:28:58.69503');
INSERT INTO public.notifications VALUES (39, 54, 'achievement', 'Your skill "Angular" has been approved!', false, 461, 10, '2025-03-20 11:29:02.344522');
INSERT INTO public.notifications VALUES (40, 54, 'achievement', 'Your skill Angular has been approved', false, 461, NULL, '2025-03-20 11:29:02.607067');
INSERT INTO public.notifications VALUES (41, 56, 'achievement', 'Your skill "Terraform" has been approved!', false, 462, 10, '2025-03-20 11:29:06.062025');
INSERT INTO public.notifications VALUES (42, 56, 'achievement', 'Your skill Terraform has been approved', false, 462, NULL, '2025-03-20 11:29:06.319988');
INSERT INTO public.notifications VALUES (43, 53, 'achievement', 'Your skill "Azure" has been approved!', false, 463, 10, '2025-03-20 11:29:14.493916');
INSERT INTO public.notifications VALUES (44, 53, 'achievement', 'Your skill Azure has been approved', false, 463, NULL, '2025-03-20 11:29:14.754008');
INSERT INTO public.notifications VALUES (45, 55, 'achievement', 'Your skill "Swift" has been approved!', false, 464, 10, '2025-03-20 11:29:17.864434');
INSERT INTO public.notifications VALUES (46, 55, 'achievement', 'Your skill Swift has been approved', false, 464, NULL, '2025-03-20 11:29:18.139574');
INSERT INTO public.notifications VALUES (47, 10, 'achievement', 'Your skill "TestOtherSkill2" was not approved. Rejected by administrator', false, NULL, 10, '2025-03-20 11:50:54.455449');
INSERT INTO public.notifications VALUES (48, 10, 'achievement', 'Your skill TestOtherSkill2 has been rejected. Please review the feedback.', false, NULL, NULL, '2025-03-20 11:50:54.642028');
INSERT INTO public.notifications VALUES (49, 10, 'achievement', 'Your skill "TestOtherSkill" was not approved. Rejected by administrator', false, NULL, 10, '2025-03-20 11:50:56.421799');
INSERT INTO public.notifications VALUES (50, 10, 'achievement', 'Your skill TestOtherSkill has been rejected. Please review the feedback.', false, NULL, NULL, '2025-03-20 11:50:56.603179');
INSERT INTO public.notifications VALUES (55, 10, 'achievement', 'Your skill "Python" was not approved. Rejected by administrator', false, NULL, 10, '2025-04-15 07:17:12.388479');
INSERT INTO public.notifications VALUES (56, 10, 'achievement', 'Your skill Python has been rejected. Please review the feedback.', false, NULL, NULL, '2025-04-15 07:17:12.573803');
INSERT INTO public.notifications VALUES (53, 10, 'achievement', 'Your skill "Terraform" has been approved!', false, NULL, 10, '2025-04-15 07:17:07.832307');
INSERT INTO public.notifications VALUES (54, 10, 'achievement', 'Your skill Terraform has been approved', false, NULL, NULL, '2025-04-15 07:17:08.093939');
INSERT INTO public.notifications VALUES (57, 10, 'achievement', 'Your skill "Terraform" has been approved!', false, 466, 10, '2025-04-16 19:32:56.091319');
INSERT INTO public.notifications VALUES (58, 10, 'achievement', 'Your skill Terraform has been approved', false, 466, NULL, '2025-04-16 19:32:56.365564');
INSERT INTO public.notifications VALUES (59, 10, 'achievement', 'Your skill "Terraform" was not approved. Rejected by administrator', false, NULL, 10, '2025-04-18 06:42:12.099049');
INSERT INTO public.notifications VALUES (60, 10, 'achievement', 'Your skill Terraform has been rejected. Please review the feedback.', false, 466, NULL, '2025-04-18 06:42:12.300291');
INSERT INTO public.notifications VALUES (61, 10, 'achievement', 'Your skill "Terraform" was not approved. Rejected by administrator', false, NULL, 10, '2025-04-18 06:42:12.831656');
INSERT INTO public.notifications VALUES (62, 10, 'achievement', 'Your skill Terraform has been rejected. Please review the feedback.', false, 466, NULL, '2025-04-18 06:42:13.010657');
INSERT INTO public.notifications VALUES (63, 10, 'achievement', 'Your skill "Terraform" was not approved. Rejected by administrator', false, NULL, 10, '2025-04-18 06:42:14.354331');
INSERT INTO public.notifications VALUES (64, 10, 'achievement', 'Your skill Terraform has been rejected. Please review the feedback.', false, 466, NULL, '2025-04-18 06:42:14.556979');
INSERT INTO public.notifications VALUES (65, 10, 'achievement', 'Your skill "Terraform" was not approved. Rejected by administrator', false, NULL, 10, '2025-04-18 06:42:20.84618');
INSERT INTO public.notifications VALUES (66, 10, 'achievement', 'Your skill Terraform has been rejected. Please review the feedback.', false, 466, NULL, '2025-04-18 06:42:21.017693');
INSERT INTO public.notifications VALUES (67, 44, 'achievement', 'Your skill "Java" was not approved. Rejected by administrator', false, NULL, 66, '2025-04-21 13:01:11.966211');
INSERT INTO public.notifications VALUES (68, 44, 'achievement', 'Your skill Java has been rejected. Please review the feedback.', false, NULL, NULL, '2025-04-21 13:01:12.175284');
INSERT INTO public.notifications VALUES (1, 69, 'achievement', 'Your skill "Scala" has been approved!', true, 442, 10, '2025-03-18 16:23:07.850032');
INSERT INTO public.notifications VALUES (2, 69, 'achievement', 'Your skill Scala has been approved', true, 442, NULL, '2025-03-18 16:23:08.158604');
INSERT INTO public.notifications VALUES (3, 69, 'achievement', 'Your skill "MongoDB" has been approved!', true, 443, 66, '2025-03-18 16:30:38.959817');
INSERT INTO public.notifications VALUES (4, 69, 'achievement', 'Your skill MongoDB has been approved', true, 443, NULL, '2025-03-18 16:30:39.23422');
INSERT INTO public.notifications VALUES (5, 69, 'achievement', 'Your skill "Express.js" has been approved!', true, 444, 66, '2025-03-18 16:30:41.033559');
INSERT INTO public.notifications VALUES (6, 69, 'achievement', 'Your skill Express.js has been approved', true, 444, NULL, '2025-03-18 16:30:41.301856');
INSERT INTO public.notifications VALUES (51, 69, 'achievement', 'Your skill "TestOtherSkill2" was not approved. Rejected by administrator', true, NULL, 10, '2025-03-21 07:30:28.410983');
INSERT INTO public.notifications VALUES (52, 69, 'achievement', 'Your skill TestOtherSkill2 has been rejected. Please review the feedback.', true, NULL, NULL, '2025-03-21 07:30:28.630224');
INSERT INTO public.notifications VALUES (75, 44, 'achievement', 'Your skill "Java" has been approved!', false, 471, 69, '2025-04-21 14:52:22.000202');
INSERT INTO public.notifications VALUES (76, 44, 'achievement', 'Your skill Java has been approved', false, 471, NULL, '2025-04-21 14:52:22.294542');
INSERT INTO public.notifications VALUES (73, 44, 'achievement', 'Your skill "Java" has been approved!', false, NULL, 69, '2025-04-21 14:52:20.487035');
INSERT INTO public.notifications VALUES (74, 44, 'achievement', 'Your skill Java has been approved', false, NULL, NULL, '2025-04-21 14:52:20.780261');
INSERT INTO public.notifications VALUES (71, 44, 'achievement', 'Your skill "Java" has been approved!', false, NULL, 69, '2025-04-21 14:52:16.842304');
INSERT INTO public.notifications VALUES (72, 44, 'achievement', 'Your skill Java has been approved', false, NULL, NULL, '2025-04-21 14:52:17.145606');
INSERT INTO public.notifications VALUES (69, 44, 'achievement', 'Your skill "Java" has been approved!', false, NULL, 69, '2025-04-21 14:52:15.273706');
INSERT INTO public.notifications VALUES (70, 44, 'achievement', 'Your skill Java has been approved', false, NULL, NULL, '2025-04-21 14:52:15.576713');


--
-- Data for Name: pending_skill_updates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pending_skill_updates VALUES (9, 44, 433, 'Vue.js', 'UI', 'expert', 'Vue.js Certified Developer', 'https://credly.com/badges/vuejs123', 'Added Vue.js certification', '2024-02-15 00:00:00', '2026-02-15 00:00:00', 'pending', '2025-03-14 16:39:22.138179', NULL, NULL, NULL, true);
INSERT INTO public.pending_skill_updates VALUES (10, 44, 435, 'Scala', 'Programming', 'expert', 'Scala Advanced Programming', 'https://credly.com/badges/scala456', 'Updated Scala certification', '2024-01-10 00:00:00', '2027-01-10 00:00:00', 'pending', '2025-03-12 16:39:22.138179', NULL, NULL, NULL, true);
INSERT INTO public.pending_skill_updates VALUES (11, 44, 232, 'Penetration Testing', 'Security', 'expert', 'Certified Ethical Hacker', 'https://credly.com/badges/ceh789', 'Improved skill level from intermediate to expert', '2023-12-05 00:00:00', '2026-12-05 00:00:00', 'pending', '2025-03-18 08:39:22.138179', NULL, NULL, NULL, true);
INSERT INTO public.pending_skill_updates VALUES (20, 57, NULL, 'SQL', 'Database', 'expert', 'Oracle SQL Certified', NULL, 'Advanced SQL knowledge', NULL, NULL, 'approved', '2025-03-11 16:40:22.463627', '2025-03-16 16:40:22.463627', 1, 'Approved after verification of certification', false);
INSERT INTO public.pending_skill_updates VALUES (21, 58, NULL, 'Ruby', 'Programming', 'intermediate', NULL, NULL, 'Self-taught Ruby', NULL, NULL, 'rejected', '2025-03-08 16:40:22.463627', '2025-03-10 16:40:22.463627', 1, 'Need formal certification for intermediate level claim', false);
INSERT INTO public.pending_skill_updates VALUES (22, 59, 400, 'JavaScript', 'Programming', 'expert', 'JavaScript Professional', NULL, 'Upgraded from intermediate', NULL, NULL, 'approved', '2025-03-04 16:40:22.463627', '2025-03-06 16:40:22.463627', 1, 'Approved based on project contributions', true);
INSERT INTO public.pending_skill_updates VALUES (23, 60, 401, 'CSS', 'UI', 'expert', NULL, NULL, 'Requesting upgrade from intermediate', NULL, NULL, 'rejected', '2025-02-26 16:40:22.463627', '2025-02-28 16:40:22.463627', 1, 'Need portfolio demonstrating expert-level work', true);
INSERT INTO public.pending_skill_updates VALUES (4, 44, NULL, 'TypeScript', 'Programming', 'intermediate', 'TypeScript Certified Developer', 'https://credly.com/badges/abc123', 'Completed TypeScript certification course', '2024-01-15 00:00:00', '2026-01-15 00:00:00', 'approved', '2025-03-15 16:39:22.138179', '2025-03-20 10:30:06.330454', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (30, 10, NULL, 'Change Management', 'Leadership', 'beginner', '', '', '', NULL, NULL, 'approved', '2025-03-20 11:28:04.594219', '2025-03-20 11:28:18.391806', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (29, 10, NULL, 'Decision Making', 'Leadership', 'beginner', '', '', '', NULL, NULL, 'approved', '2025-03-20 11:28:04.384757', '2025-03-20 11:28:21.531435', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (28, 10, NULL, 'Sketch', 'Design', 'beginner', '', '', '', NULL, NULL, 'approved', '2025-03-20 11:28:04.258828', '2025-03-20 11:28:22.30498', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (26, 10, NULL, 'Git', 'DevOps', 'beginner', '', '', '', NULL, NULL, 'approved', '2025-03-20 11:28:04.241618', '2025-03-20 11:28:23.198782', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (27, 10, NULL, 'Design Systems', 'Design', 'beginner', '', '', '', NULL, NULL, 'approved', '2025-03-20 11:28:04.254373', '2025-03-20 11:28:24.626419', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (25, 10, NULL, 'TypeScript', 'Programming', 'intermediate', '', '', '', NULL, NULL, 'approved', '2025-03-20 11:28:04.237801', '2025-03-20 11:28:26.590956', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (24, 10, NULL, 'ELK Stack', 'DevOps', 'beginner', '', '', '', NULL, NULL, 'approved', '2025-03-20 11:28:04.101141', '2025-03-20 11:28:29.000914', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (5, 45, NULL, 'React Native', 'Mobile Development', 'beginner', NULL, NULL, 'Started learning React Native', NULL, NULL, 'approved', '2025-03-13 16:39:22.138179', '2025-03-20 11:28:32.471023', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (7, 47, NULL, 'Python', 'Programming', 'expert', 'Python Professional Certification', 'https://credly.com/badges/ghi789', 'Advanced Python programming training', '2023-11-20 00:00:00', '2026-11-20 00:00:00', 'approved', '2025-03-11 16:39:22.138179', '2025-03-20 11:28:36.142088', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (8, 48, NULL, 'AWS', 'Cloud', 'beginner', NULL, NULL, 'Starting AWS learning path', NULL, NULL, 'approved', '2025-03-16 16:39:22.138179', '2025-03-20 11:28:38.923492', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (13, 50, NULL, 'GraphQL', 'API', 'intermediate', NULL, NULL, 'GraphQL course completed', NULL, NULL, 'approved', '2024-03-15 12:30:45', '2025-03-20 11:28:41.954373', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (6, 46, NULL, 'Docker', 'DevOps', 'intermediate', 'Docker Certified Associate', 'https://credly.com/badges/def456', 'Completed Docker training', '2024-02-10 00:00:00', '2027-02-10 00:00:00', 'approved', '2025-03-17 16:39:22.138179', '2025-03-20 11:28:48.679591', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (14, 51, NULL, 'MongoDB', 'Database', 'beginner', NULL, NULL, 'MongoDB training course', NULL, NULL, 'approved', '2024-03-15 12:30:45', '2025-03-20 11:28:51.864576', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (12, 49, NULL, 'Kubernetes', 'DevOps', 'beginner', NULL, NULL, 'Learning Kubernetes basics', NULL, NULL, 'approved', '2025-03-18 04:39:38.697908', '2025-03-20 11:28:54.896309', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (15, 52, NULL, 'Machine Learning', 'AI', 'beginner', NULL, NULL, 'Starting ML course', NULL, NULL, 'approved', '2024-03-01 00:00:00', '2025-03-20 11:28:58.435562', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (17, 54, NULL, 'Angular', 'UI', 'expert', 'Angular Expert', NULL, 'Empty certification date', NULL, '2026-01-01 00:00:00', 'approved', '2025-03-15 16:40:12.60594', '2025-03-20 11:29:02.344522', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (19, 56, NULL, 'Terraform', 'DevOps', 'intermediate', 'Terraform Associate', NULL, 'No dates provided', NULL, NULL, 'approved', '2025-03-13 16:40:12.60594', '2025-03-20 11:29:06.062025', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (16, 53, NULL, 'Azure', 'Cloud', 'intermediate', 'Azure Administrator', NULL, 'Azure certification with no expiration', '2024-02-15 00:00:00', NULL, 'approved', '2025-03-17 16:40:12.60594', '2025-03-20 11:29:14.493916', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (18, 55, NULL, 'Swift', 'Mobile Development', 'beginner', 'iOS Development', NULL, 'Expired certification', '2023-09-15 00:00:00', '2023-02-15 00:00:00', 'approved', '2025-03-18 16:40:12.60594', '2025-03-20 11:29:17.864434', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (32, 10, NULL, 'TestOtherSkill2', 'Other', 'intermediate', '', '', '', NULL, NULL, 'rejected', '2025-03-20 11:50:43.386856', '2025-03-20 11:50:54.455449', 10, 'Rejected by administrator', false);
INSERT INTO public.pending_skill_updates VALUES (31, 10, NULL, 'TestOtherSkill', 'Other', 'beginner', '', '', '', NULL, NULL, 'rejected', '2025-03-20 11:45:01.87364', '2025-03-20 11:50:56.421799', 10, 'Rejected by administrator', false);
INSERT INTO public.pending_skill_updates VALUES (33, 10, NULL, 'Python', 'Programming', 'beginner', '', '', '', NULL, NULL, 'pending', '2025-03-20 12:20:49.844022', NULL, NULL, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (34, 10, NULL, 'SQL', 'Data Science', 'beginner', '', '', '', NULL, NULL, 'pending', '2025-03-20 12:31:40.613068', NULL, NULL, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (35, 69, NULL, 'TestOtherSkill2', 'UI', 'expert', '', '', '', NULL, NULL, 'rejected', '2025-03-21 07:25:36.004734', '2025-03-21 07:30:28.410983', 10, 'Rejected by administrator', false);
INSERT INTO public.pending_skill_updates VALUES (36, 10, NULL, 'Terraform', 'DevOps', 'expert', '', '', '', NULL, NULL, 'approved', '2025-04-15 07:16:21.338371', '2025-04-15 07:17:07.832307', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (37, 10, NULL, 'Python', 'Programming', 'expert', 'Pycert', 'http://www.credly.com', '', NULL, NULL, 'rejected', '2025-04-15 07:16:21.388815', '2025-04-15 07:17:12.388479', 10, 'Rejected by administrator', false);
INSERT INTO public.pending_skill_updates VALUES (38, 10, NULL, 'Terraform', 'DevOps', 'expert', '', '', '', NULL, NULL, 'approved', '2025-04-16 19:30:55.302738', '2025-04-16 19:32:56.091319', 10, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (41, 10, 466, 'Terraform', 'DevOps', 'expert', 'Google Cloud Professional Cloud Architect', 'https://www.credly.com/badges/ac044ab3-527d-4065-823c-745872352af3/public_url', 'Updated Terraform', NULL, NULL, 'rejected', '2025-04-18 06:37:18.240479', '2025-04-18 06:42:12.831656', 10, 'Rejected by administrator', true);
INSERT INTO public.pending_skill_updates VALUES (40, 10, 466, 'Terraform', 'DevOps', 'beginner', NULL, NULL, 'Updated Terraform', NULL, NULL, 'rejected', '2025-04-18 06:36:52.088127', '2025-04-18 06:42:14.354331', 10, 'Rejected by administrator', true);
INSERT INTO public.pending_skill_updates VALUES (39, 10, 466, 'Terraform', 'DevOps', 'beginner', NULL, NULL, 'Updated Terraform', NULL, NULL, 'rejected', '2025-04-18 06:22:32.723665', '2025-04-18 06:42:20.84618', 10, 'Rejected by administrator', true);
INSERT INTO public.pending_skill_updates VALUES (42, 66, NULL, 'Java', 'Programming', 'intermediate', NULL, NULL, NULL, NULL, NULL, 'approved', '2025-04-20 13:45:10.580125', '2025-04-20 13:45:10.556', 66, 'Auto-approved (admin user)', false);
INSERT INTO public.pending_skill_updates VALUES (43, 44, NULL, 'Java', 'Programming', 'beginner', NULL, NULL, NULL, NULL, NULL, 'rejected', '2025-04-20 13:48:40.829676', '2025-04-21 13:01:11.966211', 66, 'Rejected by administrator', false);
INSERT INTO public.pending_skill_updates VALUES (45, 44, NULL, 'Java', 'Programming', 'intermediate', NULL, NULL, NULL, NULL, NULL, 'approved', '2025-04-21 14:26:54.773504', '2025-04-21 14:52:16.842304', 69, NULL, false);
INSERT INTO public.pending_skill_updates VALUES (44, 44, NULL, 'Java', 'Programming', 'expert', NULL, NULL, NULL, NULL, NULL, 'approved', '2025-04-21 13:09:35.058578', '2025-04-21 14:52:22.000202', 69, NULL, false);


--
-- Data for Name: profile_histories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.profile_histories VALUES (1, 10, 'firstName', '', 'vin1', '2025-03-14 10:38:28.220709');
INSERT INTO public.profile_histories VALUES (2, 10, 'lastName', '', 'ch1', '2025-03-14 10:38:28.2783');
INSERT INTO public.profile_histories VALUES (3, 10, 'project', '', 'test1111', '2025-03-14 10:38:28.31479');
INSERT INTO public.profile_histories VALUES (4, 10, 'role', '', 'developer', '2025-03-14 10:38:28.351323');
INSERT INTO public.profile_histories VALUES (5, 10, 'location', '', 'Pune', '2025-03-14 10:38:28.387778');
INSERT INTO public.profile_histories VALUES (6, 10, 'firstName', 'vin1', 'Admin', '2025-03-14 11:41:50.450875');
INSERT INTO public.profile_histories VALUES (7, 10, 'lastName', 'ch1', 'User', '2025-03-14 11:41:50.529347');
INSERT INTO public.profile_histories VALUES (8, 10, 'project', 'test1111', 'Skills Platform', '2025-03-14 11:41:50.566564');
INSERT INTO public.profile_histories VALUES (9, 10, 'role', 'developer', 'Administrator', '2025-03-14 11:41:50.604078');
INSERT INTO public.profile_histories VALUES (10, 10, 'location', 'Pune', 'Remote', '2025-03-14 11:41:50.640439');
INSERT INTO public.profile_histories VALUES (11, 10, 'firstName', 'Admin', 'Admin Updated', '2025-03-14 11:42:40.580207');
INSERT INTO public.profile_histories VALUES (12, 10, 'lastName', 'User', 'User Updated', '2025-03-14 11:42:40.62678');
INSERT INTO public.profile_histories VALUES (13, 10, 'project', 'Skills Platform', 'Skills Platform Updated', '2025-03-14 11:42:40.663151');
INSERT INTO public.profile_histories VALUES (14, 10, 'firstName', 'Admin', 'Admin Updated', '2025-03-14 11:43:53.172785');
INSERT INTO public.profile_histories VALUES (15, 10, 'lastName', 'User', 'User Updated', '2025-03-14 11:43:53.219778');
INSERT INTO public.profile_histories VALUES (16, 10, 'project', 'Skills Platform', 'Skills Platform Updated', '2025-03-14 11:43:53.256311');
INSERT INTO public.profile_histories VALUES (17, 10, 'firstName', 'Admin', 'Admin Updated', '2025-03-14 11:45:12.853357');
INSERT INTO public.profile_histories VALUES (18, 10, 'lastName', 'User', 'User Updated', '2025-03-14 11:45:12.903108');
INSERT INTO public.profile_histories VALUES (19, 10, 'project', 'Skills Platform', 'Skills Platform Updated', '2025-03-14 11:45:12.94271');
INSERT INTO public.profile_histories VALUES (20, 10, 'firstName', 'Admin Updated', 'Admin Updated 2', '2025-03-14 11:45:55.496492');
INSERT INTO public.profile_histories VALUES (21, 10, 'lastName', 'User Updated', 'User Updated 2', '2025-03-14 11:45:55.543983');
INSERT INTO public.profile_histories VALUES (22, 10, 'project', 'Skills Platform Updated', 'Skills Platform Updated 2', '2025-03-14 11:45:55.580632');
INSERT INTO public.profile_histories VALUES (23, 10, 'firstName', 'Admin Updated 2', 'Admin Updated 3', '2025-03-14 11:47:42.991217');
INSERT INTO public.profile_histories VALUES (24, 10, 'lastName', 'User Updated 2', 'User Updated 3', '2025-03-14 11:47:43.047222');
INSERT INTO public.profile_histories VALUES (25, 10, 'project', 'Skills Platform Updated 2', 'Skills Platform Updated 3', '2025-03-14 11:47:43.083707');
INSERT INTO public.profile_histories VALUES (26, 10, 'firstName', 'Admin Updated 3', 'admin', '2025-03-14 20:49:39.511206');
INSERT INTO public.profile_histories VALUES (27, 10, 'lastName', 'User Updated 3', 'user', '2025-03-14 20:49:39.573812');
INSERT INTO public.profile_histories VALUES (28, 10, 'firstName', 'admin', 'Admin', '2025-03-14 20:49:46.879403');
INSERT INTO public.profile_histories VALUES (34, 69, 'firstName', '', 'Vinayak', '2025-03-15 08:45:55.135424');
INSERT INTO public.profile_histories VALUES (35, 69, 'lastName', '', 'Chobe', '2025-03-15 08:45:55.197601');
INSERT INTO public.profile_histories VALUES (36, 69, 'project', '', 'Delivery', '2025-03-15 08:45:55.238726');
INSERT INTO public.profile_histories VALUES (37, 69, 'role', '', 'Head of Delivery', '2025-03-15 08:45:55.279709');
INSERT INTO public.profile_histories VALUES (38, 69, 'location', '', 'Pune', '2025-03-15 08:45:55.319151');


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.projects VALUES (1, 'Cloud Migration', 'Enterprise cloud migration project', 1, '2025-04-01 00:00:00', '2025-10-31 00:00:00', 'Remote', 'https://confluence.acme.com/cloud-migration', NULL, NULL, 'active', '2025-03-23 08:14:12.916245', '2025-03-23 08:14:12.916245', NULL, NULL);
INSERT INTO public.projects VALUES (2, 'Azure Devops Migration', '', 1, '2025-03-01 00:00:00', '2025-03-01 00:00:00', 'Pune', '', 50, 48, 'active', '2025-03-24 15:19:29.109252', '2025-03-24 15:19:29.109252', 'vinayak.chobe@atyeti.com', 'vinayak.chobe@atyeti.com');
INSERT INTO public.projects VALUES (3, 'AWS Migration', 'trgrt', 1, '2025-02-28 00:00:00', '2025-04-05 00:00:00', 'Pune', '', 45, 48, 'active', '2025-03-24 16:40:47.181566', '2025-03-24 16:40:47.181566', 'vinayak.chobe@atyeti.com', 'vinayak.chobe@atyeti.com');


--
-- Data for Name: project_resource_histories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_resource_histories VALUES (1, 2, 47, 'added', NULL, 'developer', NULL, 100, '2025-03-24 15:30:54.794978', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (2, 3, 45, 'added', NULL, 'Project Lead', NULL, 100, '2025-03-24 16:40:47.181566', 45, NULL);
INSERT INTO public.project_resource_histories VALUES (3, 3, 48, 'added', NULL, 'Delivery Lead', NULL, 100, '2025-03-24 16:40:47.181566', 48, NULL);
INSERT INTO public.project_resource_histories VALUES (4, 3, 52, 'added', NULL, 'Scrum Master', NULL, 100, '2025-03-24 17:06:28.327247', 52, '');
INSERT INTO public.project_resource_histories VALUES (5, 3, 52, 'added', NULL, 'Scrum Master', NULL, 100, '2025-03-24 17:06:28.783542', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (6, 3, 55, 'added', NULL, 'QA', NULL, 100, '2025-03-25 05:46:58.247353', 55, '');
INSERT INTO public.project_resource_histories VALUES (7, 3, 55, 'added', NULL, 'QA', NULL, 100, '2025-03-25 05:46:59.536209', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (8, 3, 52, 'removed', 'Scrum Master', NULL, 100, NULL, '2025-03-25 09:03:35.988409', 10, 'Removed from project');
INSERT INTO public.project_resource_histories VALUES (9, 3, 52, 'removed', 'Scrum Master', NULL, 100, NULL, '2025-03-25 09:03:36.109989', 52, 'Resource removed from project AWS Migration');
INSERT INTO public.project_resource_histories VALUES (10, 3, 55, 'removed', 'QA', NULL, 100, NULL, '2025-03-25 09:18:18.43083', 10, 'Removed from project');
INSERT INTO public.project_resource_histories VALUES (11, 3, 55, 'removed', 'QA', NULL, 100, NULL, '2025-03-25 09:18:18.567675', 55, 'Resource removed from project AWS Migration');
INSERT INTO public.project_resource_histories VALUES (12, 3, 69, 'added', NULL, ' Delivery', NULL, 100, '2025-03-25 09:23:37.836017', 69, '');
INSERT INTO public.project_resource_histories VALUES (13, 3, 69, 'added', NULL, ' Delivery', NULL, 100, '2025-03-25 09:23:38.634212', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (14, 3, 69, 'removed', ' Delivery', NULL, 100, NULL, '2025-03-25 09:24:33.630634', 10, 'Removed from project');
INSERT INTO public.project_resource_histories VALUES (15, 3, 69, 'removed', ' Delivery', NULL, 100, NULL, '2025-03-25 09:24:33.746466', 69, 'Resource removed from project AWS Migration');
INSERT INTO public.project_resource_histories VALUES (16, 3, 49, 'added', NULL, 'developer', NULL, 100, '2025-03-25 09:28:54.135347', 49, '');
INSERT INTO public.project_resource_histories VALUES (17, 3, 49, 'added', NULL, 'developer', NULL, 100, '2025-03-25 09:28:54.582925', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (18, 3, 49, 'removed', 'developer', NULL, 100, NULL, '2025-03-25 09:29:36.046728', 10, 'Removed from project');
INSERT INTO public.project_resource_histories VALUES (19, 3, 49, 'removed', 'developer', NULL, 100, NULL, '2025-03-25 09:29:36.168034', 49, 'Resource removed from project AWS Migration');
INSERT INTO public.project_resource_histories VALUES (20, 3, 50, 'added', NULL, 'developer', NULL, 100, '2025-03-25 09:36:23.052908', 50, '');
INSERT INTO public.project_resource_histories VALUES (21, 3, 50, 'added', NULL, 'developer', NULL, 100, '2025-03-25 09:36:23.910071', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (22, 3, 50, 'removed', 'developer', NULL, 100, NULL, '2025-03-25 09:36:31.619179', 10, 'Removed from project');
INSERT INTO public.project_resource_histories VALUES (23, 3, 50, 'removed', 'developer', NULL, 100, NULL, '2025-03-25 09:36:31.738865', 50, 'Resource removed from project AWS Migration');
INSERT INTO public.project_resource_histories VALUES (24, 3, 53, 'added', NULL, 'developer', NULL, 100, '2025-03-25 10:04:49.582475', 53, '');
INSERT INTO public.project_resource_histories VALUES (25, 3, 53, 'added', NULL, 'developer', NULL, 100, '2025-03-25 10:04:50.375861', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (26, 3, 54, 'added', NULL, 'developer', NULL, 100, '2025-03-25 10:05:05.643861', 54, '');
INSERT INTO public.project_resource_histories VALUES (27, 3, 54, 'added', NULL, 'developer', NULL, 100, '2025-03-25 10:05:06.088719', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (28, 3, 53, 'removed', 'developer', NULL, 100, NULL, '2025-03-25 10:05:29.581448', 10, 'Removed from project');
INSERT INTO public.project_resource_histories VALUES (29, 3, 53, 'removed', 'developer', NULL, 100, NULL, '2025-03-25 10:05:29.768246', 53, 'Resource removed from project AWS Migration');
INSERT INTO public.project_resource_histories VALUES (30, 1, 44, 'added', NULL, 'QA', NULL, 100, '2025-03-25 10:21:16.130664', 44, '');
INSERT INTO public.project_resource_histories VALUES (31, 1, 44, 'added', NULL, 'QA', NULL, 100, '2025-03-25 10:21:17.0819', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (32, 1, 45, 'added', NULL, NULL, NULL, 100, '2025-03-25 10:21:25.806857', 45, '');
INSERT INTO public.project_resource_histories VALUES (33, 1, 45, 'added', NULL, NULL, NULL, 100, '2025-03-25 10:21:26.262474', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (34, 1, 44, 'removed', 'QA', NULL, 100, NULL, '2025-03-25 10:22:17.229259', 10, 'Removed from project');
INSERT INTO public.project_resource_histories VALUES (35, 1, 44, 'removed', 'QA', NULL, 100, NULL, '2025-03-25 10:22:17.345502', 44, 'Resource removed from project Cloud Migration');
INSERT INTO public.project_resource_histories VALUES (36, 3, 44, 'added', NULL, 'developer', NULL, 100, '2025-03-25 10:23:26.435877', 44, '');
INSERT INTO public.project_resource_histories VALUES (37, 3, 44, 'added', NULL, 'developer', NULL, 100, '2025-03-25 10:23:26.87738', 10, 'Added to project');
INSERT INTO public.project_resource_histories VALUES (38, 3, 44, 'removed', 'developer', NULL, 100, NULL, '2025-03-25 10:24:18.889918', 10, 'Removed from project');
INSERT INTO public.project_resource_histories VALUES (39, 3, 44, 'removed', 'developer', NULL, 100, NULL, '2025-03-25 10:24:19.010546', 44, 'Resource removed from project AWS Migration');


--
-- Data for Name: project_resources; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_resources VALUES (1, 2, 47, 'developer', 100, '2025-02-23 00:00:00', '2025-03-29 00:00:00', '', '2025-03-24 15:30:54.710163', '2025-03-24 15:30:54.710163');
INSERT INTO public.project_resources VALUES (2, 3, 45, 'Project Lead', 100, NULL, NULL, NULL, '2025-03-24 16:40:47.181566', '2025-03-24 16:40:47.181566');
INSERT INTO public.project_resources VALUES (3, 3, 48, 'Delivery Lead', 100, NULL, NULL, NULL, '2025-03-24 16:40:47.181566', '2025-03-24 16:40:47.181566');
INSERT INTO public.project_resources VALUES (10, 3, 54, 'developer', 100, '2025-03-25 00:00:00', NULL, '', '2025-03-25 10:05:05.60723', '2025-03-25 10:05:05.60723');
INSERT INTO public.project_resources VALUES (12, 1, 45, '', 100, '2025-03-25 00:00:00', NULL, '', '2025-03-25 10:21:25.76826', '2025-03-25 10:21:25.76826');


--
-- Data for Name: project_skills; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_skills VALUES (1, 3, 463, 'beginner', 'high', '2025-03-24 16:42:09.771557');
INSERT INTO public.project_skills VALUES (2, 3, 462, 'beginner', 'medium', '2025-03-25 05:46:22.951966');
INSERT INTO public.project_skills VALUES (3, 3, 459, 'expert', 'medium', '2025-03-25 07:20:29.559552');
INSERT INTO public.project_skills VALUES (4, 3, 464, 'intermediate', 'medium', '2025-03-25 10:44:34.755943');


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.session VALUES ('zW7VjZyuYp4VMy91VTdm2807VTvt0SUS', '{"cookie":{"originalMaxAge":86400000,"expires":"2025-04-22T12:53:53.952Z","secure":false,"httpOnly":true,"path":"/"}}', '2025-04-22 12:53:56');
INSERT INTO public.session VALUES ('Y_u5eJY2nzomMrgXn3m576SuFbB82hQU', '{"cookie":{"originalMaxAge":86400000,"expires":"2025-04-22T14:25:33.938Z","secure":false,"httpOnly":true,"path":"/"}}', '2025-04-22 14:25:37');
INSERT INTO public.session VALUES ('g1Q2nIEVuG9IIuBDq7bXd9-QlQN3_dBH', '{"cookie":{"originalMaxAge":86400000,"expires":"2025-04-22T14:54:57.387Z","secure":false,"httpOnly":true,"path":"/"}}', '2025-04-23 08:56:26');


--
-- Data for Name: skill_subcategories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.skill_subcategories VALUES (1, 'Frontend', 'Web frontend technologies and frameworks', 1, '#3B82F6', 'layout', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (2, 'Backend', 'Server-side programming languages and frameworks', 1, '#3B82F6', 'server', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (3, 'Mobile', 'Mobile development languages and frameworks', 1, '#3B82F6', 'smartphone', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (4, 'Desktop', 'Desktop application development', 1, '#3B82F6', 'monitor', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (5, 'Embedded', 'Programming for embedded systems and IoT devices', 1, '#3B82F6', 'cpu', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (6, 'SQL Databases', 'Relational database systems and SQL', 2, '#8B5CF6', 'database', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (7, 'NoSQL Databases', 'Non-relational database systems', 2, '#8B5CF6', 'boxes', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (8, 'Data Modeling', 'Database architecture and modeling skills', 2, '#8B5CF6', 'git-branch', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (9, 'Database Administration', 'Installation, configuration, and management of database systems', 2, '#8B5CF6', 'shield', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (10, 'Query Optimization', 'Performance tuning and optimization of database queries', 2, '#8B5CF6', 'zap', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (11, 'AWS', 'Amazon Web Services cloud platform', 3, '#22D3EE', 'cloud', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (12, 'Azure', 'Microsoft Azure cloud platform', 3, '#22D3EE', 'cloud', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (13, 'Google Cloud', 'Google Cloud Platform', 3, '#22D3EE', 'cloud', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (14, 'Cloud Architecture', 'Designing cloud-based systems and infrastructure', 3, '#22D3EE', 'network', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (15, 'Serverless', 'Serverless architecture and functions-as-a-service', 3, '#22D3EE', 'zap', '2025-04-18 09:45:03.702272', '2025-04-18 09:45:03.702272');
INSERT INTO public.skill_subcategories VALUES (16, 'CI/CD', 'Continuous Integration and Continuous Deployment', 4, '#F97316', 'git-merge', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (17, 'Infrastructure as Code', 'Infrastructure automation and management', 4, '#F97316', 'code', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (18, 'Monitoring', 'System monitoring and observability', 4, '#F97316', 'activity', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (19, 'Containerization', 'Docker, Kubernetes, and container orchestration', 4, '#F97316', 'package', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (20, 'Configuration Management', 'Tools for managing system configurations', 4, '#F97316', 'settings', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (21, 'RESTful APIs', 'Design and implementation of REST APIs', 5, '#10B981', 'server', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (22, 'GraphQL', 'Design and implementation of GraphQL APIs', 5, '#10B981', 'git-branch', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (23, 'API Documentation', 'Creating clear API documentation', 5, '#10B981', 'file-text', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (24, 'API Testing', 'Testing and validation of APIs', 5, '#10B981', 'check-circle', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (25, 'API Security', 'Security considerations for API development', 5, '#10B981', 'shield', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (26, 'Application Security', 'Secure application development practices', 7, '#DC2626', 'shield', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (27, 'Network Security', 'Securing network infrastructure', 7, '#DC2626', 'network', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (28, 'Penetration Testing', 'Identification of security vulnerabilities', 7, '#DC2626', 'key', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (29, 'Security Compliance', 'Regulatory compliance and standards', 7, '#DC2626', 'check-square', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (30, 'Cryptography', 'Encryption and cryptographic protocols', 7, '#DC2626', 'lock', '2025-04-18 09:45:13.947546', '2025-04-18 09:45:13.947546');
INSERT INTO public.skill_subcategories VALUES (31, 'Data Analysis', 'Techniques for analyzing and interpreting data', 8, '#8B5CF6', 'bar-chart', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (32, 'Data Visualization', 'Creating visual representations of data', 8, '#8B5CF6', 'pie-chart', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (33, 'Data Engineering', 'Building data pipelines and infrastructure', 8, '#8B5CF6', 'database', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (34, 'Statistics', 'Statistical analysis and methods', 8, '#8B5CF6', 'percent', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (35, 'Big Data', 'Processing and analyzing large datasets', 8, '#8B5CF6', 'layers', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (36, 'Machine Learning', 'Creating systems that learn from data', 9, '#EC4899', 'cpu', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (37, 'Deep Learning', 'Neural networks and deep learning models', 9, '#EC4899', 'network', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (38, 'NLP', 'Natural language processing and text analysis', 9, '#EC4899', 'message-square', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (39, 'Computer Vision', 'Image and video analysis with AI', 9, '#EC4899', 'eye', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (40, 'AI Ethics', 'Ethical considerations in AI development', 9, '#EC4899', 'heart', '2025-04-18 09:45:26.851794', '2025-04-18 09:45:26.851794');
INSERT INTO public.skill_subcategories VALUES (41, 'iOS', 'Apple iOS development using Swift and Objective-C', 6, '#06B6D4', 'smartphone', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (42, 'Android', 'Android development using Java and Kotlin', 6, '#06B6D4', 'smartphone', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (43, 'React Native', 'Cross-platform mobile development using React Native', 6, '#06B6D4', 'layers', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (44, 'Flutter', 'Cross-platform mobile development using Flutter and Dart', 6, '#06B6D4', 'layers', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (45, 'Mobile UX/UI', 'Mobile user experience and interface design', 6, '#06B6D4', 'layout', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (46, 'Web UI', 'Web user interface development and frameworks', 10, '#F59E0B', 'layout', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (47, 'UI Components', 'Reusable UI component development', 10, '#F59E0B', 'box', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (48, 'Responsive Design', 'Creating interfaces that work across device sizes', 10, '#F59E0B', 'smartphone', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (49, 'Accessibility', 'Creating interfaces usable by people with disabilities', 10, '#F59E0B', 'eye', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (50, 'UI Animation', 'Creating motion and animations in interfaces', 10, '#F59E0B', 'zap', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (51, 'UX Design', 'User experience design principles and methods', 11, '#EC4899', 'users', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (52, 'Visual Design', 'Visual design principles and aesthetics', 11, '#EC4899', 'image', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (53, 'Interaction Design', 'Designing interactive systems and interfaces', 11, '#EC4899', 'mouse-pointer', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (54, 'Prototyping', 'Creating interactive prototypes of designs', 11, '#EC4899', 'box', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (55, 'Design Systems', 'Creating and maintaining design systems', 11, '#EC4899', 'grid', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (56, 'Digital Marketing', 'Online marketing strategies and campaigns', 12, '#14B8A6', 'trending-up', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (57, 'Content Marketing', 'Creating and distributing valuable content', 12, '#14B8A6', 'file-text', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (58, 'SEO', 'Search engine optimization techniques', 12, '#14B8A6', 'search', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (59, 'Social Media', 'Social media marketing and management', 12, '#14B8A6', 'share-2', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (60, 'Analytics', 'Marketing data analysis and insights', 12, '#14B8A6', 'bar-chart', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (61, 'Agile', 'Agile project management methodologies', 13, '#6366F1', 'repeat', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (62, 'Scrum', 'Scrum framework implementation and mastery', 13, '#6366F1', 'users', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (63, 'Kanban', 'Kanban method for project and workflow management', 13, '#6366F1', 'columns', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (64, 'Waterfall', 'Traditional waterfall project management', 13, '#6366F1', 'git-merge', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (65, 'Risk Management', 'Identifying and mitigating project risks', 13, '#6366F1', 'alert-triangle', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (66, 'Team Management', 'Managing and organizing teams effectively', 14, '#22C55E', 'users', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (67, 'Mentoring', 'Guiding and developing team members', 14, '#22C55E', 'user-check', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (68, 'Strategic Planning', 'Developing long-term strategies and goals', 14, '#22C55E', 'target', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (69, 'Decision Making', 'Making effective decisions in complex situations', 14, '#22C55E', 'git-branch', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (70, 'Conflict Resolution', 'Resolving conflicts within teams and organizations', 14, '#22C55E', 'shield', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (71, 'Written Communication', 'Clear and effective written communication', 15, '#3B82F6', 'file-text', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (72, 'Verbal Communication', 'Effective spoken communication and listening skills', 15, '#3B82F6', 'message-circle', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (73, 'Presentation', 'Delivering effective presentations', 15, '#3B82F6', 'airplay', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (74, 'Technical Writing', 'Creating clear technical documentation', 15, '#3B82F6', 'code', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');
INSERT INTO public.skill_subcategories VALUES (75, 'Interpersonal', 'One-on-one and small group communication skills', 15, '#3B82F6', 'users', '2025-04-18 11:15:20.028795', '2025-04-18 11:15:20.028795');


--
-- Data for Name: skill_approvers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.skill_approvers VALUES (1, 10, NULL, true, '2025-04-18 09:22:34.1738', NULL, NULL);
INSERT INTO public.skill_approvers VALUES (2, 66, 1, false, '2025-04-18 09:22:34.1738', NULL, NULL);
INSERT INTO public.skill_approvers VALUES (3, 66, 2, false, '2025-04-18 09:22:34.1738', NULL, NULL);
INSERT INTO public.skill_approvers VALUES (4, 66, 3, false, '2025-04-18 09:22:34.1738', NULL, NULL);
INSERT INTO public.skill_approvers VALUES (5, 66, 4, false, '2025-04-18 09:22:34.1738', NULL, NULL);
INSERT INTO public.skill_approvers VALUES (6, 1, 1, false, '2025-04-18 09:45:26.851794', 1, NULL);
INSERT INTO public.skill_approvers VALUES (7, 44, 1, false, '2025-04-18 11:15:52.645834', 1, NULL);
INSERT INTO public.skill_approvers VALUES (8, 45, 1, false, '2025-04-18 11:15:52.645834', 2, NULL);
INSERT INTO public.skill_approvers VALUES (9, 46, 6, false, '2025-04-18 11:15:52.645834', NULL, NULL);
INSERT INTO public.skill_approvers VALUES (10, 47, 2, false, '2025-04-18 11:15:52.645834', 6, NULL);
INSERT INTO public.skill_approvers VALUES (11, 48, 3, false, '2025-04-18 11:15:52.645834', 11, NULL);
INSERT INTO public.skill_approvers VALUES (13, 50, 12, false, '2025-04-18 11:15:52.645834', NULL, NULL);
INSERT INTO public.skill_approvers VALUES (12, 49, 11, false, '2025-04-18 11:15:52.645834', 51, NULL);
INSERT INTO public.skill_approvers VALUES (14, 51, 15, false, '2025-04-18 11:15:52.645834', 74, NULL);
INSERT INTO public.skill_approvers VALUES (20, 69, NULL, false, '2025-04-21 14:20:52.069381', NULL, 467);


--
-- Data for Name: skill_histories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.skill_histories VALUES (33, 252, 46, 'intermediate', 'expert', 'Upgraded from intermediate to expert', '2025-01-05 21:56:57.462');
INSERT INTO public.skill_histories VALUES (34, 381, 58, NULL, 'beginner', 'Added new skill at beginner level', '2025-01-28 12:01:00.076');
INSERT INTO public.skill_histories VALUES (35, 343, 55, NULL, 'beginner', 'Added new skill at beginner level', '2024-12-29 01:40:38.706');
INSERT INTO public.skill_histories VALUES (36, 404, 61, NULL, 'beginner', 'Added new skill at beginner level', '2025-01-20 22:19:40.189');
INSERT INTO public.skill_histories VALUES (37, 321, 52, NULL, 'beginner', 'Added new skill at beginner level', '2025-01-13 08:07:29.053');
INSERT INTO public.skill_histories VALUES (38, 355, 56, 'beginner', 'intermediate', 'Upgraded from beginner to intermediate', '2025-03-08 22:59:43.447');
INSERT INTO public.skill_histories VALUES (39, 287, 49, 'beginner', 'intermediate', 'Upgraded from beginner to intermediate', '2025-02-27 07:39:07.536');
INSERT INTO public.skill_histories VALUES (40, 356, 56, 'intermediate', 'expert', 'Upgraded from intermediate to expert', '2025-03-07 09:35:17.743');
INSERT INTO public.skill_histories VALUES (41, 242, 45, 'intermediate', 'expert', 'Upgraded from intermediate to expert', '2025-02-04 09:21:24.726');
INSERT INTO public.skill_histories VALUES (42, 309, 51, 'beginner', 'intermediate', 'Upgraded from beginner to intermediate', '2025-03-02 00:41:32.98');
INSERT INTO public.skill_histories VALUES (43, 257, 46, 'beginner', 'intermediate', 'Upgraded from beginner to intermediate', '2025-01-19 18:01:41.186');
INSERT INTO public.skill_histories VALUES (44, 291, 49, NULL, 'beginner', 'Added new skill at beginner level', '2024-12-19 04:00:20.83');
INSERT INTO public.skill_histories VALUES (45, 249, 45, NULL, 'beginner', 'Added new skill at beginner level', '2025-01-03 23:02:38.628');
INSERT INTO public.skill_histories VALUES (46, 397, 60, 'beginner', 'intermediate', 'Upgraded from beginner to intermediate', '2024-12-23 18:12:46.449');
INSERT INTO public.skill_histories VALUES (47, 359, 56, 'intermediate', 'expert', 'Upgraded from intermediate to expert', '2025-01-14 01:43:26.861');
INSERT INTO public.skill_histories VALUES (48, 312, 52, NULL, 'beginner', 'Added new skill at beginner level', '2024-12-20 00:10:18.416');
INSERT INTO public.skill_histories VALUES (49, 386, 59, NULL, 'beginner', 'Added new skill at beginner level', '2024-12-23 10:16:50.178');
INSERT INTO public.skill_histories VALUES (50, 420, 62, 'beginner', 'intermediate', 'Upgraded from beginner to intermediate', '2025-02-07 03:42:12.09');
INSERT INTO public.skill_histories VALUES (51, 322, 53, NULL, 'beginner', 'Added new skill at beginner level', '2025-01-09 12:32:56.517');
INSERT INTO public.skill_histories VALUES (52, 432, 10, NULL, 'intermediate', 'Initial skill creation', '2025-03-10 15:43:40.383566');
INSERT INTO public.skill_histories VALUES (53, 433, 44, NULL, 'expert', 'Initial skill creation', '2025-03-14 08:14:10.628573');
INSERT INTO public.skill_histories VALUES (54, 432, 10, 'intermediate', 'expert', 'Updated GCP', '2025-03-14 09:32:52.885199');
INSERT INTO public.skill_histories VALUES (55, 434, 10, NULL, 'beginner', 'Initial skill creation', '2025-03-14 17:28:55.967224');
INSERT INTO public.skill_histories VALUES (56, 435, 44, NULL, 'expert', 'Initial skill creation', '2025-03-14 20:51:57.14385');
INSERT INTO public.skill_histories VALUES (58, 437, 69, NULL, 'intermediate', 'Initial skill creation', '2025-03-15 08:46:48.808029');
INSERT INTO public.skill_histories VALUES (59, 438, 69, NULL, 'beginner', 'Initial skill creation', '2025-03-15 10:28:40.517708');
INSERT INTO public.skill_histories VALUES (60, 438, 69, 'beginner', 'expert', 'Updated Java', '2025-03-15 10:28:56.86238');
INSERT INTO public.skill_histories VALUES (61, 439, 69, NULL, 'beginner', 'Initial skill creation', '2025-03-18 09:37:29.784886');
INSERT INTO public.skill_histories VALUES (62, 440, 10, NULL, 'intermediate', 'Initial skill creation', '2025-03-18 15:35:49.270488');
INSERT INTO public.skill_histories VALUES (63, 441, 69, NULL, 'expert', 'Initial skill creation', '2025-03-18 15:44:22.06109');
INSERT INTO public.skill_histories VALUES (64, 442, 69, NULL, 'expert', 'Approved by admin (ID: 10)', '2025-03-18 16:23:07.850032');
INSERT INTO public.skill_histories VALUES (65, 443, 69, NULL, 'intermediate', 'Approved by admin (ID: 66)', '2025-03-18 16:30:38.959817');
INSERT INTO public.skill_histories VALUES (66, 444, 69, NULL, 'intermediate', 'Approved by admin (ID: 66)', '2025-03-18 16:30:41.033559');
INSERT INTO public.skill_histories VALUES (67, 445, 44, NULL, 'intermediate', 'Approved by admin (ID: 10)', '2025-03-20 10:30:06.330454');
INSERT INTO public.skill_histories VALUES (68, 446, 10, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:18.391806');
INSERT INTO public.skill_histories VALUES (69, 447, 10, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:21.531435');
INSERT INTO public.skill_histories VALUES (70, 448, 10, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:22.30498');
INSERT INTO public.skill_histories VALUES (71, 449, 10, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:23.198782');
INSERT INTO public.skill_histories VALUES (72, 450, 10, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:24.626419');
INSERT INTO public.skill_histories VALUES (73, 451, 10, NULL, 'intermediate', 'Approved by admin (ID: 10)', '2025-03-20 11:28:26.590956');
INSERT INTO public.skill_histories VALUES (74, 452, 10, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:29.000914');
INSERT INTO public.skill_histories VALUES (75, 453, 45, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:32.471023');
INSERT INTO public.skill_histories VALUES (76, 454, 47, NULL, 'expert', 'Approved by admin (ID: 10)', '2025-03-20 11:28:36.142088');
INSERT INTO public.skill_histories VALUES (77, 455, 48, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:38.923492');
INSERT INTO public.skill_histories VALUES (78, 456, 50, NULL, 'intermediate', 'Approved by admin (ID: 10)', '2025-03-20 11:28:41.954373');
INSERT INTO public.skill_histories VALUES (79, 457, 46, NULL, 'intermediate', 'Approved by admin (ID: 10)', '2025-03-20 11:28:48.679591');
INSERT INTO public.skill_histories VALUES (80, 458, 51, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:51.864576');
INSERT INTO public.skill_histories VALUES (81, 459, 49, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:54.896309');
INSERT INTO public.skill_histories VALUES (82, 460, 52, NULL, 'beginner', 'Approved by admin (ID: 10)', '2025-03-20 11:28:58.435562');
INSERT INTO public.skill_histories VALUES (83, 461, 54, NULL, 'expert', 'Approved by admin (ID: 10)', '2025-03-20 11:29:02.344522');
INSERT INTO public.skill_histories VALUES (84, 462, 56, NULL, 'intermed