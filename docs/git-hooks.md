# Git Hooks for WorkOS SDK

This document describes the Git hooks implemented for the WorkOS SDK project and how to set them up.

## Available Hooks

The repository includes the following Git hooks:

1. **pre-commit**: Runs before each commit to ensure code quality
   - Validates OpenAPI spec checksums
   - Generates SDK code (unless skipped)
   - Performs basic type checking
   - Use `SKIP_CODEGEN=1` environment variable for faster commits that bypass code generation

2. **pre-push**: Runs before pushing changes to ensure full code quality
   - Always runs full validation (can't be skipped)
   - Validates OpenAPI spec checksums
   - Generates SDK code
   - Runs linting
   - Runs type checking
   - Runs tests

## Setting Up Git Hooks

To enable these Git hooks, run the following command in the repository root:

```bash
git config core.hooksPath scripts/git-hooks
```

This command configures Git to use the hooks in the `scripts/git-hooks` directory instead of the default `.git/hooks` directory.

## Fast Commits with SKIP_CODEGEN

For faster development cycles, you can skip code generation during commits with:

```bash
SKIP_CODEGEN=1 git commit -m "Your commit message"
```

This is useful for quick iterations where you know the code generation isn't affected. The pre-push hook will still run full validation before pushing to ensure code quality.

## Implementation Details

- The hooks are implemented as Deno scripts that run with the necessary permissions
- They automatically execute the appropriate checks based on the Git operation
- All hooks are designed to be compatible with Deno 2.x
- No external dependencies are required as hooks use standard Deno runtime APIs
