# WorkOS JSR Project Restructuring Plan

## Repository Structure Optimization

- [ ] Implement trunk-based development with `main` as the primary branch
- [ ] Merge `deno-main` into `main` with proper version tagging
- [ ] Set up automated weekly upstream sync job
- [ ] Document the new branch workflow in `CONTRIBUTING.md`

## Project Independence Strategy

- [ ] Restructure project directories to focus on `packages/workos_sdk` as the
      sole Deno package
- [ ] Consolidate all Deno-specific configuration under root workspace
- [ ] Move OpenAPI specs to `vendor/openapi` directory
- [ ] Set up code generation scripts that run during publish rather than storing
      generated code

## CI/CD Improvement

- [ ] Consolidate CI workflows into a single matrix-based approach
- [ ] Implement automated testing across multiple Deno and Fresh versions
- [ ] Add scheduled job for upstream sync
- [ ] Create release automation for JSR publishing

## Branch Cleanup and Maintenance

- [ ] Archive or delete outdated feature branches once merged
- [ ] Replace persistent tracking branches with tags for upstream releases
- [ ] Implement branch cleanup procedures and document them

---

This plan addresses the concerns about coupling with the WorkOS SDK repository
while maintaining the ability to track and incorporate upstream changes. By
adopting trunk-based development and automating sync processes, the project
structure becomes more maintainable and independent, yet still aligned with
upstream improvements.
