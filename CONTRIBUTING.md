# Contributing to @ryantaylor/workos

Thank you for considering contributing to the Deno/JSR port of WorkOS! This document
outlines the standards and processes we follow for this project.
## Deno-Native Development

This project is a Deno-native implementation of the WorkOS SDK. When contributing, please:

1. Always use Deno and Fresh 2.x compatibility as your primary target
2. Use Deno-native APIs and approaches, avoiding Node.js patterns or compatibility layers
3. Maintain strict TypeScript typing and leverage Deno's type system
4. Test exclusively with Deno's native testing framework
5. Document all code with Deno-centric usage examples
6. Prioritize JSR.io publishing workflows and configurations

### Development Environment Setup

To set up your development environment:

1. Ensure you have Deno 2.x or later installed
2. Clone the repository
3. Copy `.env.example` to `.env` and configure your WorkOS API credentials
4. Run `deno task dev` to start the development server

### Running Tests

We use Deno's native testing framework:

```bash
# Run all tests
deno task test

# Run tests in watch mode (during development)
deno task test:watch

# Generate test coverage
deno task test:coverage

# View coverage report
deno task coverage:html
```

For detailed information about our testing approach, see [docs/test-coverage.md](docs/test-coverage.md).
5. Document Deno-specific usage patterns

## Commit Message Convention

This project follows the
[Conventional Commits](https://www.conventionalcommits.org/) specification for
commit messages. This leads to more readable messages that are easy to follow
when looking through the project history and enables us to generate changelogs
automatically.

### Commit Message Format

Each commit message consists of a **header**, an optional **body**, and an
optional **footer**. The header has a special format that includes a **type**,
an optional **scope**, and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

#### Type

The commit type must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space,
  formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such
  as documentation generation
- **perf**: A code change that improves performance
- **ci**: Changes to our CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies

#### Scope

The scope is optional and should be the name of the module affected (as
perceived by the person reading the changelog).

#### Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end

### Examples

```
feat(auth): add ability to authenticate with API key
```

```
fix(core): resolve issue with request timeout
```

```
docs(README): update installation instructions
```

```
style: apply consistent spacing throughout codebase
```

```
refactor(directory-sync): simplify directory sync implementation
```

```
test(sso): add unit tests for SSO workflow
```

```
chore: update dependencies to latest versions
```

## How to Write Good Commit Messages

1. **Be specific**: Clearly describe what changed and why
2. **Keep it concise**: Aim for 50 characters or less in the subject line
3. **Use the imperative mood**: Write as if you are giving a command
4. **Separate subject from body with a blank line**: If you need to provide more
   context
5. **Explain the why in the body**: The body is where you explain the reasoning
   behind the change
6. **Reference issues**: If the commit addresses an issue, reference it in the
   footer

## Quality Checks

All quality gates are enforced through GitHub Actions:

1. **Lint, Type-Check & Test**: Every push and pull request triggers automatic:
   - Deno linting and formatting
   - Type checking with strict TypeScript settings
   - Unit & integration tests with Deno's native test runner

2. **Commit Message Format**: All commits are automatically checked against the
   Conventional Commits specification using commitlint.

3. **Pre-commit Hook for Generated Code**: A pre-commit hook ensures that the OpenAPI-generated code is up-to-date:
   - Automatically runs `deno task generate:api` before each commit
   - Checks if there are any changes to the generated files
   - Aborts the commit if the generated code is out-of-date, prompting you to run the task and commit the changes

The pre-commit hook helps prevent CI failures by ensuring the generated code is always up-to-date with the specification.

## Publishing to JSR.io

This project is published to JSR.io, the modern registry for JavaScript and TypeScript packages. To publish a new version:

1. Ensure all tests are passing with `deno task test`
2. Update version numbers in:
   - jsr.json
   - VERSION.md
   - Any other relevant files
3. Create a git tag for the release version
4. Run `jsr publish` to publish to JSR.io

Make sure you have the appropriate permissions for publishing to the JSR.io registry.

The configuration extends `@commitlint/config-conventional`, which enforces the
Conventional Commits specification described above.

## Pull Request Process

1. Ensure your code maintains comprehensive test coverage using Deno's testing framework
2. Verify compatibility with Deno 2.x and Fresh 2.x Canary
3. Update documentation with Deno-specific examples
4. Make sure all GitHub Actions checks pass
5. Submit your pull request with a detailed description of your changes that follows our commit message convention

### Pull Request Checks

Before submitting your PR, ensure:

1. All tests pass with `deno task test`
2. Code is formatted with `deno fmt`
3. Types check with `deno check`
4. Any new functionality includes appropriate tests
5. Documentation is updated to reflect your changes

For significant changes, consider adding examples in the examples directory that demonstrate the feature with Deno and Fresh.
