-- Seed data for testing document directory tree
-- This file runs after migrations when you run: bunx supabase db reset

-- Note: Replace 'YOUR_USER_ID' with an actual user_id from auth.users
-- You can get this by running: SELECT id FROM auth.users LIMIT 1;

-- For now, we'll use a placeholder that you should replace with your actual user_id
-- Uncomment and update the INSERT statements below with your user_id

/*
INSERT INTO documents (title, path, is_folder, content, user_id, status, metadata)
VALUES
  -- Root level documents
  ('Project Ideas (Immediate)', '/', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('Courses', '/', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),

  -- Data Engineering folder (level 1)
  ('Data Engineering', '/Data Engineering', true, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('Data Engineering Playbook', '/Data Engineering', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('End-to-end Data Pipeline', '/Data Engineering', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),

  -- Data Engineering/Advanced folder (level 2)
  ('Advanced', '/Data Engineering/Advanced', true, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('Step by Step Sidetrek', '/Data Engineering/Advanced', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),

  -- AI folder (level 1)
  ('AI', '/AI', true, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('LLM', '/AI', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}'),
  ('AI App Building (Maven)', '/AI', false, '{"type": "doc", "content": []}', 'YOUR_USER_ID', 'draft', '{}');
*/

-- To use this seed file:
-- 1. Sign in to your app to create a user
-- 2. Get your user_id: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- 3. Replace 'YOUR_USER_ID' above with your actual user_id
-- 4. Uncomment the INSERT statement
-- 5. Run: bunx supabase db reset
