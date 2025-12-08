-- Seed data for testing document directory tree
-- This file runs automatically after migrations when you run: bunx supabase db reset

-- IMPORTANT: Replace 'YOUR_USER_ID' with your actual user_id
-- Get your user_id by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Example seed data (commented out - uncomment and update YOUR_USER_ID to use)
/*
INSERT INTO documents (title, path, is_folder, content, user_id, status, metadata)
VALUES
  -- Root level documents
  ('Project Ideas (Immediate)', '/', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('Courses', '/', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),

  -- Data Engineering folder (level 1)
  ('Data Engineering', '/Data Engineering', true, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('Data Engineering Playbook', '/Data Engineering/Data Engineering Playbook', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('End-to-end Data Pipeline', '/Data Engineering/End-to-end Data Pipeline', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),

  -- Data Engineering/Advanced folder (level 2)
  ('Advanced', '/Data Engineering/Advanced', true, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('Step by Step Sidetrek', '/Data Engineering/Advanced/Step by Step Sidetrek', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),

  -- AI folder (level 1)
  ('AI', '/AI', true, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('LLM', '/AI/LLM', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('AI App Building (Maven)', '/AI/AI App Building (Maven)', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}');
*/

-- To use this seed file:
-- 1. Sign in to your app to create a user
-- 2. Get your user_id: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- 3. Replace 'YOUR_USER_ID' above with your actual user_id
-- 4. Uncomment the INSERT statement
-- 5. Run: bunx supabase db reset
