# Publishing to JSR.io and GitHub Release Creation

This document outlines the steps to publish the WorkOS Deno SDK to JSR.io and
create a GitHub release.

## Prerequisites

- [Deno](https://deno.com/) installed (version 2.0.0 or higher)
- JSR.io account with publishing permissions
- GitHub access to the repository

## Publishing to JSR.io

1. **Login to JSR**

   First, authenticate with JSR using the Deno CLI:

   ```bash
   deno jsr login
   ```

   Follow the prompts to complete the authentication.

2. **Verify package**

   Before publishing, verify that your package is correctly configured:

   ```bash
   deno jsr publish --dry-run
   ```

   This will check your package configuration without actually publishing.

3. **Publish to JSR**

   Once you've verified everything is correct, publish the package:

   ```bash
   deno jsr publish
   ```

   This will publish your package to JSR.io using the version specified in
   `jsr.json`.

## Creating a GitHub Release

1. **Create a git tag**

   Create a tag for the version (make sure it matches the version in
   `jsr.json`):

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Create a GitHub Release**

   - Go to the GitHub repository page
   - Navigate to "Releases"
   - Click "Draft a new release"
   - Select the tag you just created
   - Add a title (typically "WorkOS SDK v1.0.0")
   - Copy the relevant section from CHANGELOG.md for the release description
   - Publish the release

## Version Maintenance

When preparing for a new version:

1. Update `jsr.json` with the new version number
2. Update `CHANGELOG.md` with details of changes
3. Create a pull request for review
4. After merging, follow the publishing steps above

## Troubleshooting

If you encounter issues during publishing:

- Ensure all tests pass (`deno test -A` or using the test configuration in
  `deno.test.json`)
- Verify that `jsr.json` has the correct version number
- Check that all required files are included in the `files` section of
  `jsr.json`
- Make sure excluded files are properly listed in the `exclude` section
