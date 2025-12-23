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
  INSERT INTO documents (title, path, content, user_id, status, metadata)
  VALUES
    -- Article 1: Introduction to Machine Learning
    ('Introduction to Machine Learning', '/', '# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on building systems that can learn from and make decisions based on data. Unlike traditional programming where rules are explicitly coded, machine learning algorithms improve their performance through experience.

## Types of Machine Learning

There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in unlabeled data. Reinforcement learning involves training agents to make sequences of decisions through trial and error.

## Common Applications

Machine learning powers many applications we use daily. Recommendation systems on Netflix and Spotify use collaborative filtering to suggest content. Email spam filters employ classification algorithms to detect unwanted messages. Voice assistants like Siri and Alexa rely on natural language processing and speech recognition.

The field continues to evolve rapidly with new techniques like deep learning and transformer models pushing the boundaries of what is possible with AI.', test_user_id, 'published', '{"tags": ["machine-learning", "AI", "tutorial"]}'),

    -- Article 2: Building Data Pipelines
    ('Building Scalable Data Pipelines', '/', '# Building Scalable Data Pipelines

Data pipelines are the backbone of modern data infrastructure. They automate the flow of data from various sources through transformation stages to final destinations where it can be analyzed and used for decision-making.

## Key Components

A robust data pipeline consists of several key components: data ingestion, data transformation, data storage, and data orchestration. Tools like Apache Airflow, Prefect, and Dagster help orchestrate complex workflows. For storage, data warehouses like Snowflake and BigQuery provide scalable solutions.

## Best Practices

When building data pipelines, always implement proper error handling and monitoring. Use idempotent operations to ensure pipeline reruns produce consistent results. Implement data quality checks at each stage to catch issues early. Version control your pipeline code and maintain clear documentation for team collaboration.', test_user_id, 'published', '{"tags": ["data-engineering", "pipeline", "best-practices"]}'),

    -- Article 3: Understanding Large Language Models
    ('Understanding Large Language Models', '/', '# Understanding Large Language Models

Large Language Models (LLMs) like GPT-4, Claude, and Llama have revolutionized natural language processing. These models are trained on vast amounts of text data and can perform a wide variety of language tasks without task-specific training.

## How LLMs Work

LLMs are based on the transformer architecture, which uses self-attention mechanisms to process text. During training, these models learn to predict the next token in a sequence, developing an understanding of language patterns, context, and even reasoning capabilities. The scale of these models, often with billions of parameters, enables emergent abilities not seen in smaller models.

## Practical Applications

LLMs are being integrated into numerous applications. They power chatbots and virtual assistants, assist in code generation and debugging, help with content creation and summarization, and enable semantic search capabilities. When building applications with LLMs, consider factors like prompt engineering, context management, and cost optimization.', test_user_id, 'published', '{"tags": ["LLM", "AI", "NLP", "transformers"]}'),

    -- Article 4: Web Development with React
    ('Modern Web Development with React', '/', '# Modern Web Development with React

React has become the dominant library for building user interfaces. Its component-based architecture and declarative programming model make it easier to build and maintain complex UIs.

## Core Concepts

React applications are built from components, which are reusable pieces of UI. Components can be functional or class-based, though hooks have made functional components the preferred approach. State management, props, and lifecycle methods form the foundation of React development.

## Modern React Patterns

Modern React development leverages hooks like useState, useEffect, and useContext for state and side effects. Custom hooks enable code reuse across components. React Query or SWR handle data fetching and caching. For routing, React Router provides client-side navigation.

## Performance Optimization

Optimize React apps by minimizing re-renders with React.memo and useMemo. Use code splitting and lazy loading to reduce bundle size. Implement virtualization for long lists. Profile with React DevTools to identify bottlenecks.', test_user_id, 'published', '{"tags": ["react", "web-development", "javascript", "frontend"]}'),

    -- Article 5: Database Design Principles
    ('Principles of Database Design', '/', '# Principles of Database Design

Good database design is crucial for application performance and maintainability. A well-designed database ensures data integrity, minimizes redundancy, and supports efficient queries.

## Normalization

Database normalization organizes data to reduce redundancy and improve integrity. First normal form (1NF) eliminates repeating groups. Second normal form (2NF) removes partial dependencies. Third normal form (3NF) eliminates transitive dependencies. While normalization is important, denormalization can improve read performance in specific cases.

## Indexing Strategies

Indexes speed up query performance but slow down writes. Create indexes on columns used in WHERE clauses, JOIN conditions, and ORDER BY statements. Use composite indexes for queries involving multiple columns. Monitor index usage and remove unused indexes to save space and improve write performance.

## Schema Evolution

Plan for schema changes from the start. Use migrations to version control database changes. Implement backward-compatible changes when possible. For breaking changes, use a phased approach with temporary dual-writes.', test_user_id, 'published', '{"tags": ["database", "design", "sql", "performance"]}'),

    -- Article 6: Testing Best Practices
    ('Software Testing Best Practices', '/', '# Software Testing Best Practices

Comprehensive testing ensures code quality and prevents regressions. A good testing strategy balances coverage, speed, and maintainability.

## Testing Pyramid

The testing pyramid recommends many unit tests at the base, fewer integration tests in the middle, and minimal end-to-end tests at the top. Unit tests verify individual functions and components in isolation. Integration tests ensure different parts work together correctly. End-to-end tests validate complete user workflows but are slower and more brittle.

## Modern Testing Tools

For frontend testing, use Jest or Vitest for unit tests and React Testing Library for component testing. Playwright or Cypress enable reliable end-to-end testing. For backend APIs, use pytest or Jest with supertest. Implement continuous integration to run tests automatically on every commit. Measure test coverage but focus on testing critical paths rather than achieving 100% coverage.', test_user_id, 'published', '{"tags": ["testing", "quality-assurance", "automation"]}'),

    -- Cooking Articles
    ('Mastering Pasta Carbonara', '/cooking/', '# Mastering Pasta Carbonara

Authentic carbonara is one of Rome''s most iconic dishes, made with just a handful of ingredients: pasta, guanciale, eggs, Pecorino Romano, and black pepper.

## The Traditional Method

The key to perfect carbonara is tempering the eggs properly. Cook guanciale until crispy, reserve the fat. Cook pasta al dente. Off heat, toss hot pasta with guanciale and fat. Add tempered egg mixture while tossing constantly to create a creamy sauce without scrambling the eggs.

## Common Mistakes to Avoid

Never add cream - authentic carbonara gets its creaminess from eggs and pasta water. Don''t use bacon instead of guanciale - the flavor won''t be the same. Avoid scrambling the eggs by ensuring the pan is off heat when adding them. Use quality Pecorino Romano, not Parmesan.', test_user_id, 'published', '{"tags": ["cooking", "italian", "pasta", "recipe"]}'),

    ('The Science of Sourdough Bread', '/cooking/', '# The Science of Sourdough Bread

Sourdough bread relies on wild yeast and bacteria for leavening, creating complex flavors and better digestibility compared to commercial yeast breads.

## Building a Starter

Create a sourdough starter by mixing flour and water daily for 7-10 days. Wild yeast and lactobacilli colonize the mixture, creating the characteristic tangy flavor. Feed your starter regularly - discard half and add fresh flour and water. A healthy starter doubles in size within 4-8 hours of feeding.

## Fermentation Process

Long fermentation develops flavor and makes nutrients more bioavailable. Bulk fermentation typically takes 4-6 hours at room temperature. Shape the dough and proof in the refrigerator overnight for best flavor. Bake in a dutch oven at high heat to achieve a crispy crust and open crumb.', test_user_id, 'published', '{"tags": ["cooking", "baking", "sourdough", "fermentation"]}'),

    -- SpaceX Articles
    ('SpaceX Starship Development', '/space/', '# SpaceX Starship Development

Starship represents SpaceX''s vision for fully reusable heavy-lift space transportation. Standing at 120 meters tall when stacked with Super Heavy booster, it''s the largest and most powerful rocket ever built.

## Revolutionary Design

Starship uses stainless steel construction for durability and heat resistance. The full-flow staged combustion Raptor engines burn liquid methane and oxygen - fuels that can potentially be produced on Mars. The entire system is designed for rapid reusability, with SpaceX aiming for same-day turnaround eventually.

## Testing and Iteration

SpaceX''s development philosophy embraces rapid iteration and testing. Early prototypes exploded during testing, but each failure provided valuable data. Recent test flights have demonstrated successful stage separation, orbital insertion, and controlled reentry. The ultimate goal is enabling human settlement on Mars and making life multiplanetary.', test_user_id, 'published', '{"tags": ["spacex", "starship", "rockets", "space-exploration"]}'),

    ('Falcon 9 Reusability Revolution', '/space/', '# Falcon 9 Reusability Revolution

The Falcon 9 rocket fundamentally changed the economics of spaceflight by pioneering orbital-class booster recovery and reuse.

## Landing Technology

Falcon 9 boosters perform a series of complex maneuvers to return to Earth. After stage separation, the booster flips, performs a boostback burn to reverse direction, then a reentry burn to slow down. Grid fins provide steering during descent. Finally, the landing burn brings it to a gentle touchdown on a drone ship or landing pad.

## Economic Impact

Reusability dramatically reduces launch costs. A new Falcon 9 costs about $62 million, but with reuse, marginal cost per launch drops significantly. Some boosters have flown 15+ times. This enabled SpaceX to dominate the commercial launch market and made Starlink economically viable. The industry is now racing to copy this approach.', test_user_id, 'published', '{"tags": ["spacex", "falcon-9", "reusability", "rockets"]}'),

    -- Habits Articles
    ('Atomic Habits Framework', '/productivity/', '# Atomic Habits Framework

Small, consistent changes compound into remarkable results over time. The atomic habits approach focuses on systems rather than goals, and identity-based change rather than outcome-based change.

## The Four Laws

Make it obvious - design your environment to make good habits visible and easy to start. Make it attractive - bundle habits you need to do with habits you want to do. Make it easy - reduce friction for good habits by using the two-minute rule. Make it satisfying - track your progress and never miss twice.

## Habit Stacking

Link new habits to existing ones using the formula: "After I [CURRENT HABIT], I will [NEW HABIT]." This leverages existing neural pathways. For example, "After I pour my morning coffee, I will meditate for one minute." Start tiny and gradually increase intensity.', test_user_id, 'published', '{"tags": ["habits", "productivity", "self-improvement"]}'),

    ('Building a Morning Routine', '/productivity/', '# Building a Morning Routine

A consistent morning routine sets the tone for your entire day. The key is designing a sequence that energizes you and aligns with your goals.

## Essential Elements

Start with hydration - drink water immediately upon waking. Include movement, whether that''s exercise, yoga, or a simple walk. Practice mindfulness through meditation or journaling. Fuel your body with a nutritious breakfast. Review your priorities for the day ahead.

## Making It Stick

Wake up at the same time daily, even weekends. Prepare the night before - lay out workout clothes, prep breakfast ingredients. Start extremely small - even 5 minutes counts. Don''t aim for perfection; 80% consistency beats sporadic perfection. Adjust based on what energizes you, not what influencers recommend.', test_user_id, 'published', '{"tags": ["habits", "morning-routine", "productivity", "wellness"]}');
END $$;
