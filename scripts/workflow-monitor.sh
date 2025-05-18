#!/bin/bash
# Workflow Monitor Script for GitHub Actions
# Monitors the most recent workflow run after push

# Function to monitor the most recent workflow run
monitor_workflow() {
  echo "Monitoring recent workflow run..."
  
  # Wait a moment for the workflow to start
  sleep 3
  
  # Get the most recent run ID
  run_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
  
  if [ -z "$run_id" ]; then
    echo "No workflow runs found. Try again later."
    return 1
  fi
  
  echo "Found workflow run: $run_id"
  echo "Watching workflow execution in real-time:"
  
  # Watch the workflow run
  gh run watch "$run_id"
  
  # Get final status
  status=$(gh run view "$run_id" --json conclusion --jq '.conclusion')
  echo "Workflow completed with status: $status"
  
  # Display system notification (macOS example)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "display notification \"Workflow completed with status: $status\" with title \"GitHub Actions\""
  # Linux example
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    command -v notify-send >/dev/null 2>&1 && notify-send "GitHub Actions" "Workflow completed with status: $status"
  fi
}

# Execute function
monitor_workflow