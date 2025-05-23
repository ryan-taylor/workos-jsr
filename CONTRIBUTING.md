# Contributing to the WorkOS Node.js SDK

Thank you for considering contributing to the Deno/JSR port of WorkOS! This
document outlines the standards and processes we follow for this project.

## Deno-Native Development

This project is a Deno-native implementation of the WorkOS SDK. When
contributing, please:

1. Always use Deno and Fresh 2.x compatibility as your primary target
2. Use Deno-native APIs and approaches, avoiding Node.js patterns or
   compatibility layers
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

For detailed information about our testing approach, see
[docs/test-coverage.md](docs/test-coverage.md).

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
   - AST-based async function validation (check-await task)

2. **Commit Message Format**: All commits are automatically checked against the
   Conventional Commits specification using commitlint.

3. **Async Function Validation**: The check-await task analyzes TypeScript AST
   to detect async functions missing await expressions or .then() calls:
   ```bash
   deno task check-await
   ```
   This TypeScript AST-based solution provides higher precision than ESLint
   rules and intentionally ignores test files (*.test.ts) and **tests**
   directories.

4. **Pre-commit Hook for Generated Code**: A pre-commit hook ensures that the
   OpenAPI-generated code is up-to-date:
   - Automatically runs `deno task generate:api` before each commit
   - Checks if there are any changes to the generated files
   - Aborts the commit if the generated code is out-of-date, prompting you to
     run the task and commit the changes

The pre-commit hook helps prevent CI failures by ensuring the generated code is
always up-to-date with the specification.

## Import Map Management

### What are Import Maps?

Import maps are a crucial feature in Deno that map import specifiers to their
actual location, whether that's a URL, a local file, or a JSR package. They
serve several important functions in this project:

1. **Dependency Management**: Centralizing all external dependencies in one
   configuration file
2. **URL Abstraction**: Allowing us to use clean import paths without
   hard-coding URLs throughout the codebase
3. **Version Control**: Pinning specific versions of dependencies for stability
4. **JSR Integration**: Simplifying migration from other sources (like
   deno.land/std or esm.sh) to JSR.io packages

The import map is defined in the file specified by the `importMap` field in
`deno.json` (default: `import_map.json`).

### Validating the Import Map

We have a validation script (`scripts/check-import-map.ts`) that automatically
scans the codebase for unmapped imports. This tool helps prevent runtime errors
due to missing dependencies.

To run the script:

```bash
# Check for unmapped imports
deno run -A scripts/check-import-map.ts

# Automatically fix by adding suggested entries
deno run -A scripts/check-import-map.ts --fix
```

The script will:

1. Scan directories specified in `TARGET_DIRS` for `.ts`, `.tsx`, `.js`, and
   `.jsx` files
2. Extract all import specifiers using regex patterns
3. Check if each specifier is covered by the import map
4. Report unmapped imports with JSR-formatted suggestions
5. Optionally update the import map with the `--fix` flag

### Process for Updating the Import Map

When adding new dependencies or updating existing ones:

1. **Scan for unmapped imports first**:

   ```bash
   deno run -A scripts/check-import-map.ts
   ```

2. **Review suggested mappings** and consider if they should be added as-is or
   modified.

3. **Update the import map** either:
   - Manually by editing the import map file, or
   - Automatically by running `deno run -A scripts/check-import-map.ts --fix`

4. **Verify changes** by running the test suite to ensure everything works with
   the new mappings.

5. **Commit the updated import map** along with any code changes.

### Best Practices for Import Map Management

1. **Prefer JSR.io packages** for new dependencies
2. **Use semantic versioning** when specifying package versions
3. **Keep the import map organized** with related dependencies grouped together
4. **Document non-obvious mappings** with comments in the import map file
5. **Run the validation script before committing** changes to catch unmapped
   imports early
6. **Avoid duplicative mappings** that point to the same target
7. **Remove unused mappings** when dependencies are no longer needed

### Dependency Update Process

To check for outdated dependencies and update them:

1. **Check for outdated dependencies**:
   ```bash
   deno run -A https://deno.land/x/udd/cli.ts **/*.ts
   ```
   This will list any URLs with available updates.

2. **Update versions conservatively**:
   - For standard library dependencies, prefer minor version updates unless
     major version updates are required
   - For third-party dependencies, review changelogs before upgrading to major
     versions

3. **Regenerate the lock file**:
   ```bash
   deno cache --lock=deno.lock --lock-write
   ```
   This ensures all dependent modules are cached and the lock file is up to
   date.

4. **Verify with full test suite**:
   ```bash
   deno task test
   ```
   Ensure all tests pass with the updated dependencies.

## Code Style Guidelines

We follow these code style principles to ensure consistency throughout the
codebase:

1. **TypeScript Strictness**: Use strict type checking with explicit type
   annotations.
2. **Modern JavaScript Features**: Leverage modern JavaScript syntax including
   optional chaining, nullish coalescing, and top-level await.
3. **Functional Patterns**: Prefer immutable data structures and pure functions
   where appropriate.
4. **Error Handling**: Always use explicit error handling with typed error
   objects.
5. **Documentation**: All public APIs must have JSDoc comments with parameter
   and return type documentation.
6. **Naming Conventions**:
   - Use camelCase for variables, functions, and method names
   - Use PascalCase for class, type, interface, and enum names
   - Use UPPER_SNAKE_CASE for constants
   - Use kebab-case for file names

All code should be formatted using `deno fmt` before committing.

## Code Style & Hooks

This project uses Deno's built-in formatter and linter to maintain consistent
code style. Additionally, we use lefthook for pre-commit hooks to ensure code
quality before commits.

### Linting and Formatting Standards

We follow Deno's default formatting and linting rules, with additional custom
linting rules defined in `deno.json`:

- **Formatter**: Deno's built-in formatter enforces consistent spacing,
  indentation, and overall code structure
- **Linter**: We use Deno's linter with recommended rules plus custom rules to
  prevent Node.js-style imports

### Installing and Using Lefthook

[Lefthook](https://github.com/evilmartians/lefthook) is a fast Git hooks manager
that we use to run pre-commit checks. To install lefthook:

#### With npm:

```bash
npm install -g @evilmartians/lefthook
```

#### With Cargo (Rust):

```bash
cargo install lefthook
```

#### With other package managers:

- Homebrew: `brew install lefthook`
- MacPorts: `port install lefthook`

After installation, lefthook will automatically use the configuration in
`.lefthook.yml` to run pre-commit hooks whenever you commit code.

### Running Formatting and Linting Manually

To run formatting and linting checks manually:

```bash
# Format code
deno task fmt

# Check formatting without making changes
deno task fmt --check

# Run linter
deno task lint

# Run linter on specific files
deno task lint:staged
```

### Testing Pre-commit Hooks

To test the pre-commit hooks without making an actual commit:

```bash
# Test pre-commit hooks on all files
lefthook run pre-commit --all-files

# Test pre-commit hooks on staged files only
lefthook run pre-commit
```

The pre-commit hooks will check formatting and run the linter on your changes,
ensuring code quality before the commit is made.

## Publishing to JSR.io

This project is published to JSR.io, the modern registry for JavaScript and
TypeScript packages. To publish a new version:

1. Ensure all tests are passing with `deno task test`
2. Update version numbers in:
   - jsr.json
   - VERSION.md
   - Any other relevant files
3. Create a git tag for the release version
4. Run `jsr publish` to publish to JSR.io

Make sure you have the appropriate permissions for publishing to the JSR.io
registry.

## Pull Request Process

1. Ensure your code maintains comprehensive test coverage using Deno's testing
   framework
2. Verify compatibility with Deno 2.x and Fresh 2.x Canary
3. Update documentation with Deno-specific examples
4. Make sure all GitHub Actions checks pass
5. Submit your pull request with a detailed description of your changes that
   follows our commit message convention

### Pull Request Checks

Before submitting your PR, ensure:

1. All tests pass with `deno task test`
2. Code is formatted with `deno fmt`
3. Types check with `deno check`
4. Any new functionality includes appropriate tests
5. Documentation is updated to reflect your changes
6. The import map is updated to include any new dependencies using the import
   map validation script

For significant changes, consider adding examples in the examples directory that
demonstrate the feature with Deno and Fresh.

## Branching Strategy

- All development happens on short-lived feature branches off of `main`.
- Branch names should start with `feat/`, `fix/`, or `chore/` followed by a
  concise description.
- After a pull request is merged, delete the branch both locally and remotely.
- `main` is the single source of truth and will be automatically synced weekly
  with the upstream repository.
- Upstream releases are tracked via tags named `upstream-vX.Y.Z`.
