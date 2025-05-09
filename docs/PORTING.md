# WorkOS Node to Deno Porting Guide

This document outlines the process and progress of porting the WorkOS Node.js SDK to Deno.

## Project Status

This is an **independent community port** of the WorkOS Node.js SDK to Deno. This project is not officially endorsed by WorkOS. We aim to maintain feature parity while adapting to Deno's runtime environment.

## Burndown List

The following is the complete list of tasks required to port the SDK:

1. Setup and Reference
   - Create documentation
   - Set up git references
   - Prepare repository structure

2. Core Infrastructure
   - Port HTTP client 
   - Port crypto providers
   - Adapt serialization utilities

3. Authentication Modules
   - SSO
   - Passwordless
   - MFA

4. User & Organization Management
   - User Management
   - Organizations
   - Directory Sync

5. Access Control
   - RBAC
   - FGA

6. Additional Services
   - Audit Logs
   - Webhooks
   - Admin Portal

7. Testing & Documentation
   - Unit tests
   - Integration tests
   - API documentation
   - Usage examples

## Implementation Notes

### Iron-session Omission

The original WorkOS Node.js SDK uses iron-session for encrypting and signing session data. In this port, we have **intentionally omitted iron-session** as it's a Node.js-specific library with dependencies that aren't compatible with Deno. Instead, we'll implement a similar functionality using Deno's native APIs or compatible alternatives.

### WebCrypto-only JOSE Implementation

For JWT handling and cryptographic operations, this port uses a **WebCrypto-only JOSE implementation** rather than the Node.js crypto module. This approach leverages the standard Web Crypto API available in Deno, ensuring better compatibility and security across platforms.

## Contributing

Contributions to this porting effort are welcome. Please ensure you follow the project guidelines and test your changes thoroughly before submitting pull requests.