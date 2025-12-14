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

  -- Insert test documents with actual content for RAG testing
  INSERT INTO documents (title, path, is_folder, content, user_id, status, metadata)
  VALUES
    -- Article 1: Introduction to Machine Learning
    ('Introduction to Machine Learning', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Introduction to Machine Learning"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Machine learning is a subset of artificial intelligence that focuses on building systems that can learn from and make decisions based on data. Unlike traditional programming where rules are explicitly coded, machine learning algorithms improve their performance through experience."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Types of Machine Learning"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in unlabeled data. Reinforcement learning involves training agents to make sequences of decisions through trial and error."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Common Applications"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Machine learning powers many applications we use daily. Recommendation systems on Netflix and Spotify use collaborative filtering to suggest content. Email spam filters employ classification algorithms to detect unwanted messages. Voice assistants like Siri and Alexa rely on natural language processing and speech recognition."}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "The field continues to evolve rapidly with new techniques like deep learning and transformer models pushing the boundaries of what is possible with AI."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["machine-learning", "AI", "tutorial"]}'),

    -- Article 2: Building Data Pipelines
    ('Building Scalable Data Pipelines', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Building Scalable Data Pipelines"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Data pipelines are the backbone of modern data infrastructure. They automate the flow of data from various sources through transformation stages to final destinations where it can be analyzed and used for decision-making."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Key Components"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "A robust data pipeline consists of several key components: data ingestion, data transformation, data storage, and data orchestration. Tools like Apache Airflow, Prefect, and Dagster help orchestrate complex workflows. For storage, data warehouses like Snowflake and BigQuery provide scalable solutions."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Best Practices"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "When building data pipelines, always implement proper error handling and monitoring. Use idempotent operations to ensure pipeline reruns produce consistent results. Implement data quality checks at each stage to catch issues early. Version control your pipeline code and maintain clear documentation for team collaboration."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["data-engineering", "pipeline", "best-practices"]}'),

    -- Article 3: Understanding Large Language Models
    ('Understanding Large Language Models', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Understanding Large Language Models"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Large Language Models (LLMs) like GPT-4, Claude, and Llama have revolutionized natural language processing. These models are trained on vast amounts of text data and can perform a wide variety of language tasks without task-specific training."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "How LLMs Work"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "LLMs are based on the transformer architecture, which uses self-attention mechanisms to process text. During training, these models learn to predict the next token in a sequence, developing an understanding of language patterns, context, and even reasoning capabilities. The scale of these models, often with billions of parameters, enables emergent abilities not seen in smaller models."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Practical Applications"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "LLMs are being integrated into numerous applications. They power chatbots and virtual assistants, assist in code generation and debugging, help with content creation and summarization, and enable semantic search capabilities. When building applications with LLMs, consider factors like prompt engineering, context management, and cost optimization."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["LLM", "AI", "NLP", "transformers"]}'),

    -- Article 4: Web Development with React
    ('Modern Web Development with React', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Modern Web Development with React"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "React has become the dominant framework for building modern web applications. Its component-based architecture and virtual DOM make it efficient and developer-friendly. The React ecosystem has evolved significantly with hooks, server components, and frameworks like Next.js."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Core Concepts"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "React components are the building blocks of any React application. Understanding state management is crucial - you can use local state with useState, share state via Context, or employ libraries like Redux or Zustand for complex scenarios. React hooks like useEffect and useMemo help manage side effects and optimize performance."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Modern Tools and Patterns"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Modern React development leverages TypeScript for type safety, uses build tools like Vite for fast development experience, and employs testing libraries like Jest and React Testing Library. Server-side rendering with Next.js improves performance and SEO. The React Server Components paradigm is reshaping how we think about data fetching and rendering."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["react", "web-development", "javascript", "frontend"]}'),

    -- Article 5: Vector Databases and RAG
    ('Vector Databases and RAG Systems', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Vector Databases and RAG Systems"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Retrieval-Augmented Generation (RAG) combines the power of large language models with external knowledge retrieval. Vector databases play a crucial role in RAG systems by enabling efficient semantic search over large document collections."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "How Vector Search Works"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Vector databases store high-dimensional embeddings that represent the semantic meaning of text. When you query the database, your query is converted to an embedding, and the database finds similar vectors using algorithms like cosine similarity or HNSW. This enables finding relevant information based on meaning rather than keyword matching."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Building RAG Applications"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "To build a RAG system, you need several components: a document chunking strategy to split text into manageable pieces, an embedding model to convert text to vectors, a vector database like Pinecone or pgvector, and a strategy for retrieving and ranking relevant chunks. The retrieved context is then provided to the LLM along with the user query to generate informed responses."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["RAG", "vector-database", "embeddings", "AI"]}'),

    -- Article 6: Python for Data Science
    ('Python for Data Science', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Python for Data Science"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Python has become the lingua franca of data science thanks to its rich ecosystem of libraries and tools. From data manipulation to machine learning and visualization, Python provides comprehensive solutions for the entire data science workflow."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Essential Libraries"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "NumPy provides efficient numerical computing with arrays and matrices. Pandas offers powerful data structures for data manipulation and analysis. Matplotlib and Seaborn enable data visualization. Scikit-learn provides machine learning algorithms, while libraries like TensorFlow and PyTorch power deep learning applications. Jupyter notebooks make it easy to combine code, visualizations, and narrative text."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Data Science Workflow"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "A typical data science workflow involves data collection and cleaning, exploratory data analysis, feature engineering, model training and evaluation, and deployment. Python excels at each stage with specialized tools. Always validate your data quality, split data properly for training and testing, and monitor model performance in production."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["python", "data-science", "pandas", "machine-learning"]}'),

    -- Article 7: Cloud Computing
    ('Introduction to Cloud Computing', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Introduction to Cloud Computing"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Cloud computing has transformed how organizations deploy and scale applications. Instead of maintaining physical servers, companies can leverage cloud providers like AWS, Google Cloud, and Azure to access computing resources on demand."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Service Models"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Cloud computing offers three main service models: Infrastructure as a Service (IaaS) provides virtual machines and networking, Platform as a Service (PaaS) offers development platforms and databases, and Software as a Service (SaaS) delivers complete applications over the internet. Each model provides different levels of control and management responsibility."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Benefits and Considerations"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Cloud computing provides scalability, cost efficiency through pay-as-you-go pricing, and global reach. However, organizations must consider data security, compliance requirements, vendor lock-in, and potential cost management challenges. A well-designed cloud strategy includes proper architecture planning, security measures, and cost optimization practices."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["cloud", "AWS", "infrastructure"]}'),

    -- Article 8: Docker and Containers
    ('Container Technology with Docker', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Container Technology with Docker"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Docker has revolutionized application deployment by making containerization accessible and practical. Containers package applications with all their dependencies, ensuring consistent behavior across different environments from development to production."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "How Containers Work"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Unlike virtual machines that virtualize hardware, containers share the host operating system kernel while maintaining isolation. This makes containers lightweight and fast to start. Docker images are built in layers, with each layer representing a change to the filesystem. The Docker engine manages container lifecycle, networking, and resource allocation."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Best Practices"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "When working with Docker, keep images small by using minimal base images and multi-stage builds. Use .dockerignore to exclude unnecessary files. Tag images properly for version control. In production, orchestrate containers with Kubernetes or Docker Swarm for high availability and scaling. Always scan images for security vulnerabilities before deployment."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["docker", "containers", "devops"]}'),

    -- Article 9: API Design
    ('RESTful API Design Principles', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "RESTful API Design Principles"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Well-designed APIs are the foundation of modern web applications. RESTful APIs provide a standardized way for systems to communicate over HTTP, making them easy to understand, use, and maintain."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Core REST Principles"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "REST APIs should be resource-oriented, using nouns in URLs rather than verbs. Use HTTP methods appropriately: GET for retrieval, POST for creation, PUT for updates, and DELETE for removal. Maintain statelessness where each request contains all necessary information. Implement proper status codes: 200 for success, 201 for creation, 400 for client errors, and 500 for server errors."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Advanced Considerations"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Good API design includes versioning strategies, pagination for large datasets, filtering and sorting capabilities, and comprehensive error messages. Implement rate limiting to prevent abuse. Use OAuth 2.0 or JWT for authentication. Document your API clearly with tools like OpenAPI (Swagger) and provide examples for common use cases."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["API", "REST", "backend", "web-development"]}'),

    -- Article 10: Database Indexing
    ('Database Indexing Strategies', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Database Indexing Strategies"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Database indexes are critical for query performance. They allow the database to find rows quickly without scanning entire tables. Understanding when and how to use indexes is essential for building performant applications."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Types of Indexes"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "B-tree indexes are the most common, efficient for equality and range queries. Hash indexes work well for exact match queries but not ranges. Composite indexes cover multiple columns and are useful for queries that filter on multiple fields. Partial indexes index only rows meeting specific conditions, saving space and improving performance for targeted queries."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Indexing Best Practices"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Index columns used in WHERE clauses, JOIN conditions, and ORDER BY statements. However, avoid over-indexing as indexes consume storage and slow down writes. Analyze query execution plans to identify missing indexes. Consider the cardinality of columns - high cardinality columns benefit more from indexes. Regularly maintain indexes by rebuilding or reorganizing them to prevent fragmentation."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["database", "SQL", "performance", "indexing"]}'),

    -- Article 11: Frontend Performance
    ('Frontend Performance Optimization', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Frontend Performance Optimization"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Web performance directly impacts user experience and business metrics. Users expect fast, responsive applications. Even small improvements in load time can significantly increase engagement and conversion rates."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Loading Performance"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Optimize initial page load by minimizing bundle size through code splitting and tree shaking. Use lazy loading for images and components that are not immediately visible. Implement proper caching strategies with service workers. Compress assets with gzip or brotli. Use modern image formats like WebP and implement responsive images with srcset."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Runtime Performance"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Minimize JavaScript execution time by avoiding unnecessary re-renders in React with memo and useMemo. Debounce expensive operations like search input. Use virtual scrolling for long lists. Optimize CSS by removing unused styles and avoiding expensive selectors. Monitor performance with tools like Lighthouse and Chrome DevTools to identify bottlenecks."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["performance", "frontend", "optimization", "web-development"]}'),

    -- Article 12: Testing Strategies
    ('Testing Strategies for Web Applications', '/', false, '{
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {"level": 1},
          "content": [{"type": "text", "text": "Testing Strategies for Web Applications"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Comprehensive testing ensures code quality and prevents regressions. A well-designed test suite provides confidence when making changes and serves as documentation for how the system should behave."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Testing Pyramid"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "The testing pyramid recommends many unit tests at the base, fewer integration tests in the middle, and minimal end-to-end tests at the top. Unit tests verify individual functions and components in isolation. Integration tests ensure different parts work together correctly. End-to-end tests validate complete user workflows but are slower and more brittle."}]
        },
        {
          "type": "heading",
          "attrs": {"level": 2},
          "content": [{"type": "text", "text": "Modern Testing Tools"}]
        },
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "For frontend testing, use Jest or Vitest for unit tests and React Testing Library for component testing. Playwright or Cypress enable reliable end-to-end testing. For backend APIs, use pytest or Jest with supertest. Implement continuous integration to run tests automatically on every commit. Measure test coverage but focus on testing critical paths rather than achieving 100% coverage."}]
        }
      ]
    }', test_user_id, 'published', '{"tags": ["testing", "quality-assurance", "automation"]}');
END $$;
