/**
 * Instrumentation helpers for WorkOS SDK telemetry.
 *
 * This module provides functions to instrument core WorkOS SDK methods
 * and modules with telemetry.
 */

import { SpanStatus, telemetry } from "./telemetry-manager.ts.ts";
import type { WorkOS } from "../workos.ts.ts";
import type { SSO } from "../sso/sso.ts.ts";
import type { DirectorySync } from "../directory-sync/directory-sync.ts.ts";
import type { UserManagement } from "../user-management/user-management.ts.ts";

/**
 * Instruments HTTP methods on the WorkOS class with telemetry
 * @param workos - The WorkOS instance to instrument
 */
export function instrumentWorkOSCore(workos: WorkOS): void {
  // Store the original methods
  const originalGet = workos.get.bind(workos);
  const originalPost = workos.post.bind(workos);
  const originalPut = workos.put.bind(workos);
  const originalDelete = workos.delete.bind(workos);

  // Replace with instrumented versions
  workos.get = async (path, options = {}) => {
    const spanId = telemetry.startSpan("workos.get", {
      "http.method": "GET",
      "http.path": path,
    });

    try {
      const result = await originalGet(path, options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      return result;
    } catch (error) {
      telemetry.endSpan(
        spanId,
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
        {
          "error.type": error instanceof Error
            ? error.constructor.name
            : "Unknown",
        },
      );
      throw error;
    }
  };

  workos.post = async (path, entity, options = {}) => {
    const spanId = telemetry.startSpan("workos.post", {
      "http.method": "POST",
      "http.path": path,
    });

    try {
      const result = await originalPost(path, entity, options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      return result;
    } catch (error) {
      telemetry.endSpan(
        spanId,
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
        {
          "error.type": error instanceof Error
            ? error.constructor.name
            : "Unknown",
        },
      );
      throw error;
    }
  };

  workos.put = async (path, entity, options = {}) => {
    const spanId = telemetry.startSpan("workos.put", {
      "http.method": "PUT",
      "http.path": path,
    });

    try {
      const result = await originalPut(path, entity, options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      return result;
    } catch (error) {
      telemetry.endSpan(
        spanId,
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
        {
          "error.type": error instanceof Error
            ? error.constructor.name
            : "Unknown",
        },
      );
      throw error;
    }
  };

  workos.delete = async (path, query) => {
    const spanId = telemetry.startSpan("workos.delete", {
      "http.method": "DELETE",
      "http.path": path,
    });

    try {
      await originalDelete(path, query);
      telemetry.endSpan(spanId, SpanStatus.OK);
    } catch (error) {
      telemetry.endSpan(
        spanId,
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
        {
          "error.type": error instanceof Error
            ? error.constructor.name
            : "Unknown",
        },
      );
      throw error;
    }
  };
}

/**
 * Instruments the SSO module with telemetry
 * @param sso - The SSO instance to instrument
 */
export function instrumentSSO(sso: SSO): void {
  // Store original methods
  const originalGetAuthorizationUrl = sso.getAuthorizationUrl.bind(sso);
  const originalGetProfile = sso.getProfile.bind(sso);

  // Replace with instrumented versions
  sso.getAuthorizationUrl = (options) => {
    const spanId = telemetry.startSpan("sso.getAuthorizationUrl", {
      "workos.module": "sso",
      ...options.connection ? { "sso.connection": options.connection } : {},
      ...options.organization
        ? { "sso.organization": options.organization }
        : {},
      ...options.domain ? { "sso.domain": options.domain } : {},
    });

    try {
      const result = originalGetAuthorizationUrl(options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      return result;
    } catch (error) {
      telemetry.endSpan(
        spanId,
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  };

  sso.getProfile = async (options) => {
    const spanId = telemetry.startSpan("sso.getProfile", {
      "workos.module": "sso",
    });

    try {
      const result = await originalGetProfile(options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      telemetry.recordMetric("sso.profile_requests", 1, "counter", {
        "result": "success",
      });
      return result;
    } catch (error) {
      telemetry.endSpan(
        spanId,
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
      );
      telemetry.recordMetric("sso.profile_requests", 1, "counter", {
        "result": "failure",
        "error.type": error instanceof Error
          ? error.constructor.name
          : "Unknown",
      });
      throw error;
    }
  };
}

/**
 * Instruments the DirectorySync module with telemetry
 * @param directorySync - The DirectorySync instance to instrument
 */
export function instrumentDirectorySync(directorySync: DirectorySync): void {
  // Store original methods
  const originalListUsers = directorySync.listUsers.bind(directorySync);

  // Replace with instrumented versions
  directorySync.listUsers = async (options = {}) => {
    const spanId = telemetry.startSpan("directorySync.listUsers", {
      "workos.module": "directorySync",
      ...options.directory
        ? { "directorySync.directory": options.directory }
        : {},
    });

    try {
      const result = await originalListUsers(options);
      telemetry.endSpan(spanId, SpanStatus.OK, undefined, {
        "result.count": result.data.length,
      });
      telemetry.recordMetric("directory_sync.user_queries", 1, "counter");
      return result;
    } catch (error) {
      telemetry.endSpan(
        spanId,
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  };
}

/**
 * Instruments the UserManagement module with telemetry
 * @param userManagement - The UserManagement instance to instrument
 */
export function instrumentUserManagement(userManagement: UserManagement): void {
  // Store original methods
  const originalAuthenticateWithPassword = userManagement
    .authenticateWithPassword.bind(userManagement);

  // Replace with instrumented versions
  userManagement.authenticateWithPassword = async (options) => {
    const spanId = telemetry.startSpan(
      "userManagement.authenticateWithPassword",
      {
        "workos.module": "userManagement",
        "auth.method": "password",
        ...options.email
          ? { "user.email_domain": options.email.split("@")[1] }
          : {},
      },
    );

    try {
      const result = await originalAuthenticateWithPassword(options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      telemetry.recordMetric(
        "user_management.authentication_attempts",
        1,
        "counter",
        {
          "auth.method": "password",
          "result": "success",
        },
      );
      return result;
    } catch (error) {
      telemetry.endSpan(
        spanId,
        SpanStatus.ERROR,
        error instanceof Error ? error.message : String(error),
      );
      telemetry.recordMetric(
        "user_management.authentication_attempts",
        1,
        "counter",
        {
          "auth.method": "password",
          "result": "failure",
          "error.type": error instanceof Error
            ? error.constructor.name
            : "Unknown",
        },
      );
      throw error;
    }
  };
}
