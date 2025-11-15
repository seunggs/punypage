1. looks good
2. we should move frontend env vars to .env.local - should we move .env (sensitive data) to inside server/ dir instead?
3. option b
4. let's use pattern c please
5. option b
6. for central things like supabase client, this is fine, but we're going to have feature based dir structure. so for something like documents, we should have everything (types, hooks, components, etc) in features/documents/ dir. let's create CLAUDE.md to document this dir strcuture preference. follow the best practice for prompt engineering here and be very concise and only tell claude things it wouldn't normally know or can't figure out easily by reading our code - feature based dir structure is our preference so let's record that concisely: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices#core-principles. let's create a Prompt Engineering Best Practice section to tell claude to write documentation based on this prompot engineering principel.
