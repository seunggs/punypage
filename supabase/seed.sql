-- Seed data for testing document directory tree and RAG system
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

  -- Insert test documents with markdown content for RAG testing
  INSERT INTO documents (title, path, is_folder, content, user_id, status, metadata)
  VALUES
    -- Article 1: Introduction to Machine Learning
    ('Introduction to Machine Learning', '/', false, '# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on building systems that can learn from and make decisions based on data. Unlike traditional programming where rules are explicitly coded, machine learning algorithms improve their performance through experience.

## Types of Machine Learning

There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in unlabeled data. Reinforcement learning involves training agents to make sequences of decisions through trial and error.

## Common Applications

Machine learning powers many applications we use daily. Recommendation systems on Netflix and Spotify use collaborative filtering to suggest content. Email spam filters employ classification algorithms to detect unwanted messages. Voice assistants like Siri and Alexa rely on natural language processing and speech recognition.

The field continues to evolve rapidly with new techniques like deep learning and transformer models pushing the boundaries of what is possible with AI.', test_user_id, 'published', '{"tags": ["machine-learning", "AI", "tutorial"]}'),

    -- Article 2: Building Data Pipelines
    ('Building Scalable Data Pipelines', '/', false, '# Building Scalable Data Pipelines

Data pipelines are the backbone of modern data infrastructure. They automate the flow of data from various sources through transformation stages to final destinations where it can be analyzed and used for decision-making.

## Key Components

A robust data pipeline consists of several key components: data ingestion, data transformation, data storage, and data orchestration. Tools like Apache Airflow, Prefect, and Dagster help orchestrate complex workflows. For storage, data warehouses like Snowflake and BigQuery provide scalable solutions.

## Best Practices

When building data pipelines, always implement proper error handling and monitoring. Use idempotent operations to ensure pipeline reruns produce consistent results. Implement data quality checks at each stage to catch issues early. Version control your pipeline code and maintain clear documentation for team collaboration.', test_user_id, 'published', '{"tags": ["data-engineering", "pipeline", "best-practices"]}'),

    -- Article 3: Understanding Large Language Models
    ('Understanding Large Language Models', '/', false, '# Understanding Large Language Models

Large Language Models (LLMs) like GPT-4, Claude, and Llama have revolutionized natural language processing. These models are trained on vast amounts of text data and can perform a wide variety of language tasks without task-specific training.

## How LLMs Work

LLMs are based on the transformer architecture, which uses self-attention mechanisms to process text. During training, these models learn to predict the next token in a sequence, developing an understanding of language patterns, context, and even reasoning capabilities. The scale of these models, often with billions of parameters, enables emergent abilities not seen in smaller models.

## Practical Applications

LLMs are being integrated into numerous applications. They power chatbots and virtual assistants, assist in code generation and debugging, help with content creation and summarization, and enable semantic search capabilities. When building applications with LLMs, consider factors like prompt engineering, context management, and cost optimization.', test_user_id, 'published', '{"tags": ["LLM", "AI", "NLP", "transformers"]}'),

    -- Article 4: Web Development with React
    ('Modern Web Development with React', '/', false, '# Modern Web Development with React

React has become the dominant library for building user interfaces. Its component-based architecture and declarative programming model make it easier to build and maintain complex UIs.

## Core Concepts

React applications are built from components, which are reusable pieces of UI. Components can be functional or class-based, though hooks have made functional components the preferred approach. State management, props, and lifecycle methods form the foundation of React development.

## Modern React Patterns

Modern React development leverages hooks like useState, useEffect, and useContext for state and side effects. Custom hooks enable code reuse across components. React Query or SWR handle data fetching and caching. For routing, React Router provides client-side navigation.

## Performance Optimization

Optimize React apps by minimizing re-renders with React.memo and useMemo. Use code splitting and lazy loading to reduce bundle size. Implement virtualization for long lists. Profile with React DevTools to identify bottlenecks.', test_user_id, 'published', '{"tags": ["react", "web-development", "javascript", "frontend"]}'),

    -- Article 5: Database Design Principles
    ('Principles of Database Design', '/', false, '# Principles of Database Design

Good database design is crucial for application performance and maintainability. A well-designed database ensures data integrity, minimizes redundancy, and supports efficient queries.

## Normalization

Database normalization organizes data to reduce redundancy and improve integrity. First normal form (1NF) eliminates repeating groups. Second normal form (2NF) removes partial dependencies. Third normal form (3NF) eliminates transitive dependencies. While normalization is important, denormalization can improve read performance in specific cases.

## Indexing Strategies

Indexes speed up query performance but slow down writes. Create indexes on columns used in WHERE clauses, JOIN conditions, and ORDER BY statements. Use composite indexes for queries involving multiple columns. Monitor index usage and remove unused indexes to save space and improve write performance.

## Schema Evolution

Plan for schema changes from the start. Use migrations to version control database changes. Implement backward-compatible changes when possible. For breaking changes, use a phased approach with temporary dual-writes.', test_user_id, 'published', '{"tags": ["database", "design", "sql", "performance"]}'),

    -- Article 6: Testing Best Practices
    ('Software Testing Best Practices', '/', false, '# Software Testing Best Practices

Comprehensive testing ensures code quality and prevents regressions. A good testing strategy balances coverage, speed, and maintainability.

## Testing Pyramid

The testing pyramid recommends many unit tests at the base, fewer integration tests in the middle, and minimal end-to-end tests at the top. Unit tests verify individual functions and components in isolation. Integration tests ensure different parts work together correctly. End-to-end tests validate complete user workflows but are slower and more brittle.

## Modern Testing Tools

For frontend testing, use Jest or Vitest for unit tests and React Testing Library for component testing. Playwright or Cypress enable reliable end-to-end testing. For backend APIs, use pytest or Jest with supertest. Implement continuous integration to run tests automatically on every commit. Measure test coverage but focus on testing critical paths rather than achieving 100% coverage.', test_user_id, 'published', '{"tags": ["testing", "quality-assurance", "automation"]}');
END $$;
