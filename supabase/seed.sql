-- Seed data for testing document directory tree
-- This file runs automatically after migrations when you run: bunx supabase db reset

DO $$
DECLARE
  test_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  -- Create test user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    test_user_id,
    'authenticated',
    'authenticated',
    'seungchan@deepintuitions.com',
    crypt('testpass2025!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create identity record
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    test_user_id,
    'seungchan@deepintuitions.com',
    format('{"sub":"%s","email":"seungchan@deepintuitions.com"}', test_user_id)::jsonb,
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Create profile
  INSERT INTO profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    test_user_id,
    'seungchan@deepintuitions.com',
    'Seungchan Lee',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert test documents
  INSERT INTO documents (title, path, is_folder, content, user_id, status, metadata)
  VALUES
    -- Root level documents
    ('Project Ideas', '/', false, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),
    ('Courses', '/', false, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),

    -- AI folder (level 1)
    ('AI', '/AI', true, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),
    ('LLM', '/AI/LLM', false, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),
    ('AI App Building', '/AI/AI App Building', false, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),

    -- Data Engineering folder (level 1)
    ('Data Engineering', '/Data Engineering', true, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),
    ('Playbook', '/Data Engineering/Playbook', false, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),
    ('Pipeline', '/Data Engineering/Pipeline', false, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),

    -- Data Engineering/Advanced folder (level 2)
    ('Advanced', '/Data Engineering/Advanced', true, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}'),
    ('Sidetrek', '/Data Engineering/Advanced/Sidetrek', false, '{"type": "doc", "content": []}', test_user_id, 'draft', '{}');
END $$;
