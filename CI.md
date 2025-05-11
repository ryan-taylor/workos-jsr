# Continuous Integration Matrix Configuration

## Introduction

This document outlines the configuration for our Continuous Integration (CI)
matrix testing setup. The primary purpose of this matrix is to ensure
compatibility with multiple versions of Fresh:

- **Fresh 2.x Stable**: The current stable release of Fresh that most users will
  be deploying in production.
- **Fresh Canary**: The latest development version of Fresh, allowing us to
  catch compatibility issues early.

By testing against both versions, we can:

1. Ensure our code works with the current stable release
2. Proactively identify and address compatibility issues with upcoming Fresh
   releases
3. Maintain backwards compatibility while adopting new features

## Matrix Job Configurations

### Job 1: Fresh 2.x Stable

This job uses the standard `import_map.json` which references the stable version
of Fresh.

```yaml
fresh-stable:
  name: Test with Fresh 2.x Stable
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Deno
      uses: denoland/setup-deno@v1
      with:
        deno-version: v1.x

    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/deno
        key: ${{ runner.os }}-deno-${{ hashFiles('deno.json') }}
        restore-keys: ${{ runner.os }}-deno-

    - name: Run tests with stable import map
      run: deno test -A --import-map=import_map.json tests_deno/
```

### Job 2: Fresh Canary

This job uses the `import_map.canary.json` which references the canary version
of Fresh.

```yaml
fresh-canary:
  name: Test with Fresh Canary
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Deno
      uses: denoland/setup-deno@v1
      with:
        deno-version: v1.x

    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/deno
        key: ${{ runner.os }}-deno-canary-${{ hashFiles('deno.json') }}
        restore-keys: ${{ runner.os }}-deno-canary-

    - name: Run tests with canary import map
      run: deno test -A --import-map=import_map.canary.json tests_deno/
```

## Example GitHub Actions Workflow

Below is a complete example of how to implement this matrix testing setup in a
GitHub Actions workflow:

```yaml
name: CI Matrix Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  fresh-stable:
    name: Test with Fresh 2.x Stable
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/deno
          key: ${{ runner.os }}-deno-${{ hashFiles('deno.json') }}
          restore-keys: ${{ runner.os }}-deno-

      - name: Run tests with stable import map
        run: deno test -A --import-map=import_map.json tests_deno/

  fresh-canary:
    name: Test with Fresh Canary
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/deno
          key: ${{ runner.os }}-deno-canary-${{ hashFiles('deno.json') }}
          restore-keys: ${{ runner.os }}-deno-canary-

      - name: Run tests with canary import map
        run: deno test -A --import-map=import_map.canary.json tests_deno/
```
