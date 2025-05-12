#!/usr/bin/env bash
# dialect-diff-check-enhanced.sh
#
# This script checks for OpenAPI dialect and API path/verb changes between spec versions.
# It now includes oasdiff integration for detecting endpoint changes.
#
# Exit codes:
#  0: No issues detected
#  1: Error occurred during execution
#  2: Dialect change detected (for CI to flag as warning/attention needed)
#  3: Checksum validation failed
#  4: Both dialect change and checksum validation issues detected
#  5: API path/verb changes detected
#  6: Multiple types of changes detected
#
# Usage: ./dialect-diff-check-enhanced.sh [--post-comment] [--spec-dir=DIR] [--skip-checksums] [--skip-api-diff] [--warn-only]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPEC_DIR="vendor/openapi"
POST_COMMENT=false
SKIP_CHECKSUMS=false
SKIP_API_DIFF=false
WARN_ONLY=false
GITHUB_STEP_SUMMARY=${GITHUB_STEP_SUMMARY:-""}
EXIT_CODE=0

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
    --skip-checksums)
      SKIP_CHECKSUMS=true
      shift
      ;;
    --skip-api-diff)
      SKIP_API_DIFF=true
      shift
      ;;
    --warn-only)
      WARN_ONLY=true
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

# Validate spec checksums if not skipped
CHECKSUM_ISSUES=false
if [ "$SKIP_CHECKSUMS" != "true" ]; then
  echo -e "\n=== Validating OpenAPI Spec Checksums ==="
  
  # Collect arguments for the checksum validation script
  CHECKSUM_ARGS=()
  CHECKSUM_ARGS+=("--spec-dir=$SPEC_DIR")
  
  if [ "$WARN_ONLY" = "true" ]; then
    CHECKSUM_ARGS+=("--warn-only")
  fi
  
  # Run the checksum validation
  echo "Running: deno run -A scripts/ci/validate-spec-checksums.ts ${CHECKSUM_ARGS[*]}"
  if ! deno run -A scripts/ci/validate-spec-checksums.ts "${CHECKSUM_ARGS[@]}"; then
    CHECKSUM_ISSUES=true
    echo "🚨 Checksum validation failed"
    
    # Only set exit code if not in warn-only mode
    if [ "$WARN_ONLY" != "true" ]; then
      EXIT_CODE=3
    fi
  else
    echo "✅ Checksum validation passed"
  fi
fi

# Check if the dialect has changed
DIALECT_CHANGE=false
if [ "$LATEST_DIALECT" != "$PREVIOUS_DIALECT" ]; then
  DIALECT_CHANGE=true
  echo -e "\n🚨 DIALECT CHANGE DETECTED 🚨"
  echo "  Previous version: $PREVIOUS_VERSION"
  echo "  New version: $LATEST_VERSION"
  
  # Set exit code for dialect change
  if [ $EXIT_CODE -eq 0 ]; then
    EXIT_CODE=2
  elif [ $EXIT_CODE -eq 3 ]; then
    # Both dialect change and checksum issues
    EXIT_CODE=4
  elif [ $EXIT_CODE -eq 5 ]; then
    # Both dialect change and API changes
    EXIT_CODE=6
  fi
  
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
  
  # Exit code already set above
else
  echo -e "\n✅ No dialect change detected"
fi

# Check for API changes using oasdiff if not skipped
API_CHANGES=false
if [ "$SKIP_API_DIFF" != "true" ]; then
  echo -e "\n=== Checking for API Path/Verb Changes ==="
  
  # Collect arguments for the API diff check script
  API_DIFF_ARGS=()
  API_DIFF_ARGS+=("--spec-dir=$SPEC_DIR")
  
  if [ "$POST_COMMENT" = true ]; then
    API_DIFF_ARGS+=("--post-comment")
  fi
  
  # Explicitly provide the base and revision files
  API_DIFF_ARGS+=("--base=$PREVIOUS_SPEC")
  API_DIFF_ARGS+=("--revision=$LATEST_SPEC")
  
  # Run the API diff check
  echo "Running: deno run -A scripts/ci/api-path-diff-check.ts ${API_DIFF_ARGS[*]}"
  if ! deno run -A scripts/ci/api-path-diff-check.ts "${API_DIFF_ARGS[@]}"; then
    API_DIFF_EXIT=$?
    
    # Check if the exit code is 2, which indicates API changes detected
    if [ $API_DIFF_EXIT -eq 2 ]; then
      API_CHANGES=true
      echo "🚨 API path/verb changes detected"
      
      # Set exit code for API changes
      if [ $EXIT_CODE -eq 0 ]; then
        EXIT_CODE=5
      elif [ $EXIT_CODE -eq 2 ]; then
        # Both dialect change and API changes
        EXIT_CODE=6
      elif [ $EXIT_CODE -eq 3 ]; then
        # Both checksum issues and API changes
        EXIT_CODE=6
      elif [ $EXIT_CODE -eq 4 ]; then
        # All three issues: dialect, checksums, and API changes
        EXIT_CODE=6
      fi
    else
      # Some other error occurred
      echo "Error running API diff check (exit code: $API_DIFF_EXIT)"
      if [ $EXIT_CODE -eq 0 ]; then
        EXIT_CODE=1
      fi
    fi
  else
    echo "✅ No API path/verb changes detected"
  fi
else
  echo -e "\n=== API Path/Verb Check Skipped ==="
fi

# Provide summary of all checks
echo -e "\n=== Check Summary ==="
echo "Dialect check: $([ "$DIALECT_CHANGE" = "true" ] && echo "🚨 Changes detected" || echo "✅ No changes")"

if [ "$SKIP_CHECKSUMS" != "true" ]; then
  echo "Checksum validation: $([ "$CHECKSUM_ISSUES" = "true" ] && echo "🚨 Issues found" || echo "✅ Passed")"
else
  echo "Checksum validation: Skipped"
fi

if [ "$SKIP_API_DIFF" != "true" ]; then
  echo "API path/verb check: $([ "$API_CHANGES" = "true" ] && echo "🚨 Changes detected" || echo "✅ No changes")"
else
  echo "API path/verb check: Skipped"
fi

# Create a combined report if multiple issues were detected
if [ "$POST_COMMENT" = true ] && [ -n "$GITHUB_STEP_SUMMARY" ]; then
  if [[ "$DIALECT_CHANGE" = "true" && "$CHECKSUM_ISSUES" = "true" ]] || 
     [[ "$DIALECT_CHANGE" = "true" && "$API_CHANGES" = "true" ]] || 
     [[ "$CHECKSUM_ISSUES" = "true" && "$API_CHANGES" = "true" ]]; then
    echo -e "## 🚨 Multiple OpenAPI Specification Issues Detected\n\n" >> "$GITHUB_STEP_SUMMARY"
    echo -e "Multiple issues were detected with the OpenAPI specifications:" >> "$GITHUB_STEP_SUMMARY"
    
    if [ "$DIALECT_CHANGE" = "true" ]; then
      echo -e "- OpenAPI dialect has changed from \`$PREVIOUS_VERSION\` to \`$LATEST_VERSION\`" >> "$GITHUB_STEP_SUMMARY"
    fi
    
    if [ "$CHECKSUM_ISSUES" = "true" ]; then
      echo -e "- Checksum validation issues were found" >> "$GITHUB_STEP_SUMMARY"
    fi
    
    if [ "$API_CHANGES" = "true" ]; then
      echo -e "- API path/verb changes were detected" >> "$GITHUB_STEP_SUMMARY"
    fi
    
    echo -e "\nPlease review the detailed logs for more information." >> "$GITHUB_STEP_SUMMARY"
  fi
fi

echo -e "\nExit code: $EXIT_CODE"
exit $EXIT_CODE