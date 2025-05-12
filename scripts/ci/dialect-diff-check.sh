#!/usr/bin/env bash
# dialect-diff-check.sh
#
# This script checks for OpenAPI dialect changes between spec versions.
# It can be used in CI pipelines to detect and report on OpenAPI version changes.
#
# Exit codes:
#  0: No dialect change detected
#  1: Error occurred during execution
#  2: Dialect change detected (for CI to flag as warning/attention needed)
#
# Usage: ./dialect-diff-check.sh [--post-comment] [--spec-dir=DIR]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPEC_DIR="vendor/openapi"
POST_COMMENT=false
GITHUB_STEP_SUMMARY=${GITHUB_STEP_SUMMARY:-""}

# Parse arguments
for arg in "$@"; do
  case $arg in
    --post-comment)
      POST_COMMENT=true
      shift
      ;;
    --spec-dir=*)
      SPEC_DIR="${arg#*=}"
      shift
      ;;
    *)
      echo "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# Check if the spec directory exists
if [ ! -d "$SPEC_DIR" ]; then
  echo "Error: Spec directory '$SPEC_DIR' not found"
  exit 1
fi

# Find the two most recent spec files
SPEC_FILES=$(find "$SPEC_DIR" -name "workos-*.json" | sort -r)
LATEST_SPEC=$(echo "$SPEC_FILES" | head -n 1)
PREVIOUS_SPEC=$(echo "$SPEC_FILES" | sed -n '2p')

if [ -z "$LATEST_SPEC" ]; then
  echo "Error: No spec files found in '$SPEC_DIR'"
  exit 1
fi

if [ -z "$PREVIOUS_SPEC" ]; then
  echo "Warning: Only one spec file found, nothing to compare against"
  echo "Latest spec: $LATEST_SPEC"
  exit 0
fi

echo "Comparing specs:"
echo "  Latest: $(basename "$LATEST_SPEC")"
echo "  Previous: $(basename "$PREVIOUS_SPEC")"

# Extract dialect information
extract_dialect() {
  local spec_file=$1
  if [ ! -f "$spec_file" ]; then
    echo "Error: Spec file not found: $spec_file"
    exit 1
  fi

  # First try to get from the x-openapi-dialect extension
  DIALECT=$(grep -o '"x-openapi-dialect":\s*"[^"]*"' "$spec_file" | sed 's/"x-openapi-dialect":\s*"\(.*\)"/\1/')
  
  # If not found, try to extract from openapi or swagger field
  if [ -z "$DIALECT" ]; then
    OPENAPI=$(grep -o '"openapi":\s*"[^"]*"' "$spec_file" | sed 's/"openapi":\s*"\(.*\)"/\1/')
    SWAGGER=$(grep -o '"swagger":\s*"[^"]*"' "$spec_file" | sed 's/"swagger":\s*"\(.*\)"/\1/')
    
    if [ -n "$OPENAPI" ]; then
      DIALECT="https://spec.openapis.org/dialect/$OPENAPI"
    elif [ -n "$SWAGGER" ]; then
      DIALECT="https://spec.openapis.org/dialect/$SWAGGER"
    else
      DIALECT="unknown"
    fi
  fi
  
  echo "$DIALECT"
}

LATEST_DIALECT=$(extract_dialect "$LATEST_SPEC")
PREVIOUS_DIALECT=$(extract_dialect "$PREVIOUS_SPEC")

echo "Dialect analysis:"
echo "  Latest: $LATEST_DIALECT"
echo "  Previous: $PREVIOUS_DIALECT"

# Extract major.minor version from dialect URL
extract_version() {
  local dialect=$1
  VERSION=$(echo "$dialect" | grep -o '[0-9]\+\.[0-9]\+' || echo "unknown")
  echo "$VERSION"
}

LATEST_VERSION=$(extract_version "$LATEST_DIALECT")
PREVIOUS_VERSION=$(extract_version "$PREVIOUS_DIALECT")

# Check if the dialect has changed
if [ "$LATEST_DIALECT" != "$PREVIOUS_DIALECT" ]; then
  echo "🚨 DIALECT CHANGE DETECTED 🚨"
  echo "  Previous version: $PREVIOUS_VERSION"
  echo "  New version: $LATEST_VERSION"
  
  # Generate the comment content
  COMMENT_CONTENT="## 🚨 OpenAPI Dialect Change Detected 🚨\n\n"
  COMMENT_CONTENT+="The OpenAPI specification dialect has changed from \`$PREVIOUS_VERSION\` to \`$LATEST_VERSION\`.\n\n"
  
  # Add advice based on the version change
  if [ "$LATEST_VERSION" != "unknown" ] && [ "$PREVIOUS_VERSION" != "unknown" ]; then
    if (( $(echo "$LATEST_VERSION > $PREVIOUS_VERSION" | bc -l) )); then
      COMMENT_CONTENT+="This is a **version upgrade**. You may need to:\n"
      COMMENT_CONTENT+="- Run \`deno task codegen:upgrade\` to handle the upgrade process\n"
      COMMENT_CONTENT+="- Update any custom templates for compatibility\n"
      COMMENT_CONTENT+="- Review generated code for breaking changes\n"
    elif (( $(echo "$LATEST_VERSION < $PREVIOUS_VERSION" | bc -l) )); then
      COMMENT_CONTENT+="This is a **version downgrade**. This is unusual and may indicate an issue with:\n"
      COMMENT_CONTENT+="- The API spec source\n"
      COMMENT_CONTENT+="- The parsing or versioning logic\n"
    fi
  fi
  
  COMMENT_CONTENT+="\nSee [OpenAPI Specification](https://spec.openapis.org/) for more details on version differences."
  
  # Post comment if requested and in a CI environment
  if [ "$POST_COMMENT" = true ]; then
    if [ -n "$GITHUB_STEP_SUMMARY" ]; then
      # GitHub Actions - write to step summary
      echo -e "$COMMENT_CONTENT" >> "$GITHUB_STEP_SUMMARY"
      echo "Posted dialect change information to GitHub step summary"
    else
      # Not in GitHub Actions - just display the comment
      echo -e "Would post the following comment in CI:"
      echo -e "$COMMENT_CONTENT"
    fi
  fi
  
  # Exit with code 2 to indicate dialect change (for CI pipelines)
  exit 2
else
  echo "✅ No dialect change detected"
  exit 0
fi