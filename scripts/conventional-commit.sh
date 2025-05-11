#!/bin/bash

# Conventional Commit Helper Script
# This script helps format commits according to the Conventional Commits specification
# https://www.conventionalcommits.org/

echo "=== WorkOS Deno SDK Conventional Commit Helper ==="
echo ""
echo "This script will help you organize your changes into conventional commits."
echo ""

# Section 1: Handling diverged branches
echo "== HANDLING DIVERGED BRANCHES =="
echo "If your branch has diverged from the remote, use the following rebase approach:"
echo ""
echo "  git fetch origin"
echo "  git rebase origin/main"
echo "  # Resolve any conflicts that arise during rebase"
echo "  git add <resolved-files>"
echo "  git rebase --continue"
echo ""
echo "This approach maintains a clean linear history and makes reviews easier."
echo ""

# Section 2: Conventional Commit Template
echo "== CONVENTIONAL COMMIT TEMPLATE =="
echo "Format: <type>[optional scope]: <description>"
echo ""
echo "Types:"
echo "  feat:     A new feature"
echo "  fix:      A bug fix"
echo "  docs:     Documentation only changes"
echo "  style:    Changes that do not affect the meaning of the code"
echo "  refactor: A code change that neither fixes a bug nor adds a feature"
echo "  test:     Adding missing tests or correcting existing tests"
echo "  chore:    Changes to the build process or auxiliary tools"
echo "  perf:     Performance improvements"
echo "  ci:       Changes to CI configuration files and scripts"
echo "  build:    Changes that affect the build system or external dependencies"
echo ""
echo "Example: git commit -m \"feat(auth): add passwordless authentication flow\""
echo ""

# Section 3: Examples for current working directory changes
echo "== EXAMPLES FOR CURRENT CHANGES =="
echo "Based on your current git status, here are suggested commits:"
echo ""

echo "1. For configuration changes:"
echo "   git add .gitignore commitlint.config.js renovate.json .husky/ deno.json deno.lock import_map.json fresh.config.ts"
echo "   git commit -m \"build: update project configuration and dependencies\""
echo ""

echo "2. For documentation changes:"
echo "   git add README.md docs/PORTING.md CONTRIBUTING.md"
echo "   git commit -m \"docs: improve project documentation and contribution guidelines\""
echo ""

echo "3. For test infrastructure:"
echo "   git add tests_deno/ cov/ .github/workflows/coverage.yml scripts/coverage-report.ts"
echo "   git commit -m \"test: implement Deno test framework and CI coverage reporting\""
echo ""

echo "4. For core code changes:"
echo "   git add src/ mod.ts routes/ islands/ utils/ components/ tests_deno/"
echo "   git commit -m \"feat: implement core SDK functionality\""
echo ""

echo "5. For reference materials:"
echo "   git add _reference/"
echo "   git commit -m \"chore: add reference implementation materials\""
echo ""

echo "Remember to verify each set of files before committing to ensure they're logically grouped."
echo ""
echo "=== Happy Coding! ==="