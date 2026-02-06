---
name: coding-conventions
description: Coding conventions for TypeScript, styling with TailwindCSS, code formatting with Prettier and ESLint, and testing with Vitest
---

# Coding Conventions

## TypeScript

- Use TypeScript for all new code
- Enable strict mode in [tsconfig.json](mdc:tsconfig.json)
- Define types for all props and state
- Use type inference where possible

## Styling

- Use TailwindCSS for styling
- Follow the configuration in [tailwind.config.ts](mdc:tailwind.config.ts)
- Use Shadcn UI components as defined in [components.json](mdc:components.json)

## Code Formatting

- Code is formatted using Prettier, configuration in [.prettierrc](mdc:.prettierrc)
- ESLint rules are defined in [eslint.config.js](mdc:eslint.config.js)
- Run format checks before committing

## Testing

- Write tests for new features
- Use Vitest for testing
- Follow the setup in [vitest-setup-client.ts](mdc:vitest-setup-client.ts)
