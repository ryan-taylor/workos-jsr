# Development Workflow & Project Structure

This is an *unofficial* fork of the WorkOS SDK for Deno & Fresh maintained by **Ryan Taylor** (@ryantaylor). All credits to the original WorkOS SDK by WorkOS (https://github.com/workos-inc/workos-node).

---

## 1. Fork-Sync Workflow
```mermaid
flowchart LR
  A[Local Repository] -->|push| B[origin (ryan-taylor/workos-jsr)]
  B -->|pull| A
  A -->|pull| C[upstream (workos-inc/workos-node)]
  C -->|merge| A
  click B "https://github.com/ryan-taylor/workos-jsr" "Open origin"
  click C "https://github.com/workos-inc/workos-node" "Open upstream"
```

## 2. Branching Model
```mermaid
flowchart TB
  M[main] -.->|branch off| F[feature/xyz]
  F -->|open PR| PRo[PR to origin]
  PRo -->|merge| M
  M -->|sync| PRu[PR to upstream]
  PRu -->|merge| M
  F -.->|rebase| M
```

## 3. Project Directory Structure
```mermaid
flowchart TB
  ROOT["<root>/"]
  ROOT --> docs["docs/"]
  ROOT --> src["src/"]
  ROOT --> examples["examples/"]
  ROOT --> gh[".github/"]
  ROOT --> scripts["scripts/"]
  ROOT --> tests["tests/"]
  ROOT --> pkg["package.json, tsconfig.json, etc."]
  
  subgraph docs
    UI["ui/"]
    WF["WORKFLOW.md"]
  end
  
  subgraph src
    common["common/"]
    core["core/"]
    actions["actions/"]
    auditLogs["audit-logs/"]
    ...["... additional modules ..."]
  end
``` 