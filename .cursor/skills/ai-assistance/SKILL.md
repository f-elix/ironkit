---
name: ai-assistance
description: Guidelines for AI assistance including documentation standards, component documentation, route documentation, API documentation, and best practices
---

# AI Assistance Guidelines

## Documentation Standards

- Follow Svelte's LLM documentation conventions (svelte.dev/docs/llms)
- Create `/llms.txt` in project root for AI-specific documentation
- Document complex components with JSDoc comments
- Include type information for all exports

## Component Documentation

- Document props with TypeScript interfaces
- Include usage examples in comments
- Document events and dispatched actions
- Explain component lifecycle

## Route Documentation

- Document page parameters
- Explain data loading patterns
- Document form actions
- Include error handling examples

## API Documentation

- Document endpoint inputs and outputs
- Include TypeScript types for request/response
- Document error states
- Include authentication requirements

## Best Practices

- Keep documentation up to date with code changes
- Use TypeScript for better type inference
- Document breaking changes
- Include migration guides when needed
