# GitHub Actions CLI Monitoring

This document outlines how to monitor GitHub Actions workflow status directly in
the terminal using GitHub CLI and alternatives.

## GitHub CLI for Workflow Status Monitoring

The GitHub CLI (`gh`) offers several commands that can be used to monitor and
report GitHub Actions workflow status:

### Available Commands

- `gh run list` - Lists recent workflow runs
- `gh run view <run-id>` - Shows details of a specific run
- `gh run watch <run-id>` - Watches a workflow run in real-time (most useful for
  monitoring)
- `gh workflow view [<workflow-id> | <workflow-name> | <filename>]` - Views a
  summary of a specific workflow

### Examples

List recent workflow runs:

```bash
gh run list
```

View details of the most recent run:

```bash
gh run list --limit 1 --json databaseId --jq '.[0].databaseId' | xargs gh run view
```

Watch the most recent workflow run in real-time:

```bash
gh run list --limit 1 --json databaseId --jq '.[0].databaseId' | xargs gh run watch
```

## Alternative Approaches

Several alternative methods exist for monitoring workflow status:

1. **Custom Shell Scripts** - Create scripts that combine GitHub CLI with system
   notifications:

   ```bash
   # Example for macOS
   function notify-on-workflow-completion() {
     pushd=$(git push "$@")
     echo "$pushd"
     sleep 5  # Give GitHub time to start the workflow
     run_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
     gh run watch "$run_id"
     status=$(gh run view "$run_id" --json conclusion --jq '.conclusion')
     osascript -e "display notification \"Workflow $run_id completed with status: $status\" with title \"GitHub Actions\""
   }
   alias git-push-notify="notify-on-workflow-completion"
   ```

2. **Git Aliases** - Create Git aliases that run notification commands after
   push:

   ```bash
   # Add to ~/.gitconfig
   [alias]
     pushwatch = "!f() { git push $@ && gh run list --limit 1 --json databaseId --jq '.[0].databaseId' | xargs gh run watch; }; f"
   ```

3. **GitHub's Built-in Notifications** - Configure GitHub's notification
   settings to receive alerts via email, web, or mobile when workflows complete.

## Recommended Integration Approach

For integration with the current workflow in this repository, we recommend the
following approach:

1. Create a shell script that automates monitoring after pushing:

```bash
#!/bin/bash
# File: scripts/workflow-monitor.sh

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
```

2. Make the script executable:

```bash
chmod +x scripts/workflow-monitor.sh
```

3. Create a Git alias in your repository:

```bash
# Add to .git/config or global ~/.gitconfig
[alias]
  pushwatch = "!sh -c 'git push \"$@\" && scripts/workflow-monitor.sh' -"
```

4. Use the alias when pushing to automatically monitor workflow status:

```bash
git pushwatch
# or
git pushwatch origin main
```

This implementation gives developers immediate feedback on workflow status
directly in the terminal without having to check the GitHub web interface.
