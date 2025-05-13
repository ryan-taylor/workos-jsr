# Test Coverage with Deno's Native Tools

This project leverages Deno's built-in coverage tools to provide comprehensive test coverage reporting. Deno's native test coverage capabilities allow us to analyze code coverage without relying on external tools or Node.js compatibility layers.

## Available Commands

### Primary Test Commands

#### `deno task test`

Runs the full test suite using Deno's native test runner.

```sh
deno task test
```

This is the primary command for verifying all functionality.

#### `deno task test:watch`

Runs tests in watch mode, automatically re-running tests when files change. This is ideal for development work.

```sh
deno task test:watch
```

This command:
1. Runs the same test files as the standard test command (ignoring _reference and examples)
2. Continuously watches for file changes
3. Automatically re-runs tests when changes are detected

### Coverage Commands

The following commands are available for working with Deno's native coverage tools:

### `deno task test:coverage`

Runs a lightweight test suite and generates an LCOV coverage report.

```sh
deno task test:coverage
```

This command:
1. Runs the basic test files
2. Collects coverage information in the `cov_profile` directory
3. Generates an LCOV report at `coverage.lcov`

### `deno task test:coverage:full`

Runs a more comprehensive test suite (excluding known problematic areas) and generates an LCOV coverage report.

```sh
deno task test:coverage:full
```

This command:
1. Runs most of the test files (excluding _reference, examples, and src/fga)
2. Type-checking is disabled with `--no-check` to bypass temporary type issues
3. Collects coverage information in the `cov_profile` directory
4. Generates an LCOV report at `coverage.lcov`

### `deno task test:coverage:report`

Runs tests with coverage and generates both LCOV output and a human-readable console report.

```sh
deno task test:coverage:report
```

### `deno task coverage:report`

Generates a human-readable coverage report without running tests (uses existing coverage data).

```sh
deno task coverage:report
```

### `deno task coverage:html`

Generates an HTML coverage report from the LCOV file. This provides a detailed, interactive view of code coverage that can be opened in any web browser.

```sh
deno task coverage:html
```

This command:
1. Takes the LCOV file (defaults to `coverage.lcov` in the project root)
2. Generates an HTML report in the `coverage_html` directory
3. Provides clickable file listings with line-by-line coverage information

Note: This task requires the `genhtml` utility from the LCOV package to be installed on your system. The script will check for this dependency and provide installation instructions if needed.
## Coverage Data Files and Formats

Coverage data is stored in several locations and formats:

### Raw Coverage Profiles
- **Location**: `cov_profile/` directory (git-ignored)
- **Format**: JSON files containing detailed coverage information
- **Purpose**: Source data for all coverage reports

### LCOV Files
- **Main file**: `coverage.lcov` in project root
- **Secondary file**: `cov_profile/lcov.info`
- **Format**: Standard LCOV format compatible with most coverage tools
- **Purpose**: Integration with external coverage visualization tools

### HTML Report
- **Location**: `coverage_html/` directory
- **Entry point**: `coverage_html/index.html`
- **Format**: Interactive HTML with source code highlighting
- **Purpose**: Human-readable visualization of coverage data

## Integration with CI/Coverage Tools

Our Deno coverage implementation integrates with modern CI systems:

### GitHub Actions
- Automatically runs coverage on pull requests
- Posts coverage summaries as PR comments
- Tracks coverage trends over time

### External Tools
The generated LCOV files are compatible with:
- Codecov
- Coveralls
- SonarQube
- Other standard coverage visualization tools

### Local Development
For local development, the HTML report provides the most user-friendly way to explore coverage:
1. Run `deno task coverage:html`
2. Open `coverage_html/index.html` in your browser
3. Navigate through the interactive report to identify areas needing more tests

## JSR.io Publication Coverage Requirements

Before publishing new versions to JSR.io, we verify coverage meets these requirements:
- Overall coverage above 80%
- No new untested code in critical modules
- All new features have corresponding tests
- GitHub Actions workflows for coverage reporting