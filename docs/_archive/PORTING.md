# [ARCHIVED] WorkOS Node.js to Deno/JSR Port

> **Archive Note**: This document was archived on May 11, 2025 because it contains an outdated burndown checklist for the initial Node.js to Deno port that is no longer relevant to current users. It's preserved for historical reference only.

## Burndown Checklist

### Subtask 1: Setup and Reference
- [ ] Create docs/PORTING.md with burndown list
- [ ] Add upstream WorkOS-Node repository reference
- [ ] Create upstream version reference branch
- [ ] Clone repo for reference and checkout main branch

### Subtask 2: Bootstrap Deno Project
- [ ] Initialize empty Deno project
- [ ] Configure deno.json with imports and tasks
- [ ] Create project directory structure
- [ ] Create basic source skeleton files

### Subtask 3: Core Framework Implementation
- [ ] Implement core HTTP client with fetch
- [ ] Implement WorkOS base class
- [ ] Create error handling system
- [ ] Create test framework

### Subtask 4: First Service (SSO) Implementation
- [ ] Implement SSO interfaces
- [ ] Implement authorization URL generator
- [ ] Implement profile and token retrieval
- [ ] Create comprehensive tests

### Subtask 5: Quality Assurance and Publishing
- [ ] Setup GitHub CI workflow
- [ ] Create JSR publishing configuration
- [ ] Add documentation for the ported library
- [ ] Prepare for JSR publish dry-run

---

## Dependency Notes

- **jose**: Use a Deno/WebCrypto-native implementation via JSR (e.g. jsr:@panva/jose). No Node polyfills.
- **iron-session**: Omit. Not needed for SDK core; if session helpers are needed, use Deno std/http and WebCrypto.
- **General**: Prefer Deno std and JSR/ESM packages. Avoid Node polyfills. Keep API surface as close to Node SDK as possible, but use Deno idioms (URL, Response, AbortSignal) where appropriate.