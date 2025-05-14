# WorkOS OpenAPI Specifications

This directory contains version-pinned copies of the WorkOS OpenAPI
specification files.

## Purpose

These specification files serve as the source of truth for code generation in
our project. By storing version-pinned copies of the WorkOS OpenAPI specs, we
ensure that our builds are hermetic and reproducible.

## Naming Convention

Files in this directory follow this naming format:

```
workos-YYYY-MM-DD-SHA.json
```

Where:

- `YYYY-MM-DD` is the date of the API spec version
- `SHA` is the commit hash or version identifier

## Usage Guidelines

- These files are used as the source of truth for code generation
- Each file is pinned to a specific version of the API spec
- **IMPORTANT:** These spec files should never be manually edited
