# Release Process

This document describes the automated release process for the WorkOS SDK.

## Automated Release Workflow

We use an automated release process that follows these steps:

1. Developers merge PRs with
   [Conventional Commit](https://www.conventionalcommits.org/) messages to
   `main`
2. Release-Please automatically creates/updates a "Release PR" that:
   - Bumps the version in `deno.json`
   - Updates the `CHANGELOG.md` file
   - Has a title pattern of "chore(release): vX.Y.Z"
3. When the Release PR is merged, it automatically:
   - Creates a git tag (e.g., `v1.2.3`)
   - Triggers the publish workflow to publish to JSR

We've consolidated workflows and now use specific versions for all GitHub
Actions to enhance stability. We're using the "simple" release type in
Release-Please configuration to streamline the release process. Additionally,
we've removed redundant workflows and streamlined the CI process for better
efficiency.

No manual version editing or tag creation is required!

## CI/CD Workflow Structure

Our CI/CD system consists of three main workflow types:

1. **Test/Lint Workflows**: These run on pull requests and pushes to main branch
   - Verify code quality and correctness
   - Run unit tests across supported platforms
   - Check linting and formatting

2. **Release-Please Workflow**: Manages the release process
   - Creates and updates release PRs based on conventional commits
   - Maintains the changelog and version numbers

3. **Publishing Workflow**: Triggered on tag creation
   - Publishes packages to JSR
   - Runs automatically after a Release PR is merged

All workflows use pinned GitHub Actions versions to prevent breaking changes and
ensure long-term stability.

## Commit Message Convention

Release-Please uses conventional commit messages to determine version bumps:

- `fix:` → patch bump (e.g., 1.0.0 → 1.0.1)
- `feat:` → minor bump (e.g., 1.0.0 → 1.1.0)
- `feat!:`, `fix!:`, or commit with `BREAKING CHANGE:` footer → major bump
  (e.g., 1.0.0 → 2.0.0)

Example commit messages:

```
feat: add Directory Sync delta endpoint
```

```
fix: handle pagination correctly in SSO list endpoints
```

```
feat!: rework authentication API

BREAKING CHANGE: The authenticate() method now returns a Promise
```

## Local Development

For local development and testing, you can use:

```
deno task publish:snapshot
```

This runs a dry-run publication with full panic messages shown.

## JSR Repository Integration

The repository uses OIDC authentication for secure publication to JSR without
the need for API tokens. To set up a new repository for OIDC authentication:

1. On jsr.io, open your package → Settings → "GitHub integration"
2. Enter the repository URL and click **Link**
3. GitHub Actions will automatically use OIDC authentication when publishing
