# Test Coverage with Deno

This project supports generating test coverage reports with LCOV format for integration with coverage visualization tools.

## Available Commands

### `deno task test:watch`

Runs tests in watch mode, automatically re-running tests when files change.

```sh
deno task test:watch
```

This command:
1. Runs the same test files as the standard test command (ignoring _reference and examples)
2. Continuously watches for file changes
3. Automatically re-runs tests when changes are detected

The following commands are available for working with test coverage:

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

## Coverage Profile Data

Coverage data is stored in the `cov_profile` directory, which is git-ignored. The generated data includes:

- Raw coverage profile data
- An LCOV info file at `cov_profile/lcov.info`
- An HTML report at `coverage_html/index.html` (when generated with `deno task coverage:html`)

Additionally, a `coverage.lcov` file is generated in the project root for easy integration with coverage visualization tools.

## Integration with CI/Coverage Tools

The generated LCOV file can be used with tools like:

- Codecov
- Coveralls
- SonarQube
- GitHub Actions workflows for coverage reporting