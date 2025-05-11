# Contributing to @ryantaylor/workos

Thank you for considering contributing to @ryantaylor/workos! This document
outlines the standards and processes we follow for this project.

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
   - Deno linting
   - Type checking
   - Unit & integration tests

2. **Commit Message Format**: All commits are automatically checked against the
   Conventional Commits specification using commitlint.

You no longer need local Git hooks or Husky. Simply `git commit` & `git push`;
the Checks tab in your PR will show the results.

The configuration extends `@commitlint/config-conventional`, which enforces the
Conventional Commits specification described above.

## Pull Request Process

1. Ensure your code maintains 100% test coverage
2. Update documentation if necessary
3. Make sure all GitHub Actions checks pass
4. Submit your pull request with a detailed description of your changes
