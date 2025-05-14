/**
 * Instrumentation helpers for WorkOS SDK telemetry.
 *
 * This module provides functions to instrument core WorkOS SDK methods
 * and modules with telemetry.
 */ import { SpanStatus, telemetry } from "./telemetry-manager.ts";
/**
 * Instruments HTTP methods on the WorkOS class with telemetry
 * @param workos - The WorkOS instance to instrument
 */ export function instrumentWorkOSCore(workos) {
  // Store the original methods
  const originalGet = workos.get.bind(workos);
  const originalPost = workos.post.bind(workos);
  const originalPut = workos.put.bind(workos);
  const originalDelete = workos.delete.bind(workos);
  // Replace with instrumented versions
  workos.get = async (path, options = {})=>{
    const spanId = telemetry.startSpan("workos.get", {
      "http.method": "GET",
      "http.path": path
    });
    try {
      const result = await originalGet(path, options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      return result;
    } catch (error) {
      telemetry.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error), {
        "error.type": error instanceof Error ? error.constructor.name : "Unknown"
      });
      throw error;
    }
  };
  workos.post = async (path, entity, options = {})=>{
    const spanId = telemetry.startSpan("workos.post", {
      "http.method": "POST",
      "http.path": path
    });
    try {
      const result = await originalPost(path, entity, options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      return result;
    } catch (error) {
      telemetry.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error), {
        "error.type": error instanceof Error ? error.constructor.name : "Unknown"
      });
      throw error;
    }
  };
  workos.put = async (path, entity, options = {})=>{
    const spanId = telemetry.startSpan("workos.put", {
      "http.method": "PUT",
      "http.path": path
    });
    try {
      const result = await originalPut(path, entity, options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      return result;
    } catch (error) {
      telemetry.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error), {
        "error.type": error instanceof Error ? error.constructor.name : "Unknown"
      });
      throw error;
    }
  };
  workos.delete = async (path, query)=>{
    const spanId = telemetry.startSpan("workos.delete", {
      "http.method": "DELETE",
      "http.path": path
    });
    try {
      await originalDelete(path, query);
      telemetry.endSpan(spanId, SpanStatus.OK);
    } catch (error) {
      telemetry.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error), {
        "error.type": error instanceof Error ? error.constructor.name : "Unknown"
      });
      throw error;
    }
  };
}
/**
 * Instruments the SSO module with telemetry
 * @param sso - The SSO instance to instrument
 */ export function instrumentSSO(sso) {
  // Store original methods
  const originalGetAuthorizationUrl = sso.getAuthorizationUrl.bind(sso);
  const originalGetProfile = sso.getProfile.bind(sso);
  // Replace with instrumented versions
  sso.getAuthorizationUrl = (options)=>{
    const spanId = telemetry.startSpan("sso.getAuthorizationUrl", {
      "workos.module": "sso",
      ...options.connection ? {
        "sso.connection": options.connection
      } : {},
      ...options.organization ? {
        "sso.organization": options.organization
      } : {},
      ...options.domain ? {
        "sso.domain": options.domain
      } : {}
    });
    try {
      const result = originalGetAuthorizationUrl(options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      return result;
    } catch (error) {
      telemetry.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error));
      throw error;
    }
  };
  sso.getProfile = async (options)=>{
    const spanId = telemetry.startSpan("sso.getProfile", {
      "workos.module": "sso"
    });
    try {
      const result = await originalGetProfile(options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      telemetry.recordMetric("sso.profile_requests", 1, "counter", {
        "result": "success"
      });
      return result;
    } catch (error) {
      telemetry.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error));
      telemetry.recordMetric("sso.profile_requests", 1, "counter", {
        "result": "failure",
        "error.type": error instanceof Error ? error.constructor.name : "Unknown"
      });
      throw error;
    }
  };
}
/**
 * Instruments the DirectorySync module with telemetry
 * @param directorySync - The DirectorySync instance to instrument
 */ export function instrumentDirectorySync(directorySync) {
  // Store original methods
  const originalListUsers = directorySync.listUsers.bind(directorySync);
  // Replace with instrumented versions
  directorySync.listUsers = async (options = {})=>{
    const spanId = telemetry.startSpan("directorySync.listUsers", {
      "workos.module": "directorySync",
      ...options.directory ? {
        "directorySync.directory": options.directory
      } : {}
    });
    try {
      const result = await originalListUsers(options);
      telemetry.endSpan(spanId, SpanStatus.OK, undefined, {
        "result.count": result.data.length
      });
      telemetry.recordMetric("directory_sync.user_queries", 1, "counter");
      return result;
    } catch (error) {
      telemetry.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error));
      throw error;
    }
  };
}
/**
 * Instruments the UserManagement module with telemetry
 * @param userManagement - The UserManagement instance to instrument
 */ export function instrumentUserManagement(userManagement) {
  // Store original methods
  const originalAuthenticateWithPassword = userManagement.authenticateWithPassword.bind(userManagement);
  // Replace with instrumented versions
  userManagement.authenticateWithPassword = async (options)=>{
    const spanId = telemetry.startSpan("userManagement.authenticateWithPassword", {
      "workos.module": "userManagement",
      "auth.method": "password",
      ...options.email ? {
        "user.email_domain": options.email.split("@")[1]
      } : {}
    });
    try {
      const result = await originalAuthenticateWithPassword(options);
      telemetry.endSpan(spanId, SpanStatus.OK);
      telemetry.recordMetric("user_management.authentication_attempts", 1, "counter", {
        "auth.method": "password",
        "result": "success"
      });
      return result;
    } catch (error) {
      telemetry.endSpan(spanId, SpanStatus.ERROR, error instanceof Error ? error.message : String(error));
      telemetry.recordMetric("user_management.authentication_attempts", 1, "counter", {
        "auth.method": "password",
        "result": "failure",
        "error.type": error instanceof Error ? error.constructor.name : "Unknown"
      });
      throw error;
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc3JjL3RlbGVtZXRyeS9pbnN0cnVtZW50YXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBJbnN0cnVtZW50YXRpb24gaGVscGVycyBmb3IgV29ya09TIFNESyB0ZWxlbWV0cnkuXG4gKlxuICogVGhpcyBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRvIGluc3RydW1lbnQgY29yZSBXb3JrT1MgU0RLIG1ldGhvZHNcbiAqIGFuZCBtb2R1bGVzIHdpdGggdGVsZW1ldHJ5LlxuICovXG5cbmltcG9ydCB7IFNwYW5TdGF0dXMsIHRlbGVtZXRyeSB9IGZyb20gXCIuL3RlbGVtZXRyeS1tYW5hZ2VyLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFdvcmtPUyB9IGZyb20gXCIuLi93b3Jrb3MudHNcIjtcbmltcG9ydCB0eXBlIHsgU1NPIH0gZnJvbSBcIi4uL3Nzby9zc28udHNcIjtcbmltcG9ydCB0eXBlIHsgRGlyZWN0b3J5U3luYyB9IGZyb20gXCIuLi9kaXJlY3Rvcnktc3luYy9kaXJlY3Rvcnktc3luYy50c1wiO1xuaW1wb3J0IHR5cGUgeyBVc2VyTWFuYWdlbWVudCB9IGZyb20gXCIuLi91c2VyLW1hbmFnZW1lbnQvdXNlci1tYW5hZ2VtZW50LnRzXCI7XG5cbi8qKlxuICogSW5zdHJ1bWVudHMgSFRUUCBtZXRob2RzIG9uIHRoZSBXb3JrT1MgY2xhc3Mgd2l0aCB0ZWxlbWV0cnlcbiAqIEBwYXJhbSB3b3Jrb3MgLSBUaGUgV29ya09TIGluc3RhbmNlIHRvIGluc3RydW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RydW1lbnRXb3JrT1NDb3JlKHdvcmtvczogV29ya09TKTogdm9pZCB7XG4gIC8vIFN0b3JlIHRoZSBvcmlnaW5hbCBtZXRob2RzXG4gIGNvbnN0IG9yaWdpbmFsR2V0ID0gd29ya29zLmdldC5iaW5kKHdvcmtvcyk7XG4gIGNvbnN0IG9yaWdpbmFsUG9zdCA9IHdvcmtvcy5wb3N0LmJpbmQod29ya29zKTtcbiAgY29uc3Qgb3JpZ2luYWxQdXQgPSB3b3Jrb3MucHV0LmJpbmQod29ya29zKTtcbiAgY29uc3Qgb3JpZ2luYWxEZWxldGUgPSB3b3Jrb3MuZGVsZXRlLmJpbmQod29ya29zKTtcblxuICAvLyBSZXBsYWNlIHdpdGggaW5zdHJ1bWVudGVkIHZlcnNpb25zXG4gIHdvcmtvcy5nZXQgPSBhc3luYyAocGF0aCwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgY29uc3Qgc3BhbklkID0gdGVsZW1ldHJ5LnN0YXJ0U3BhbihcIndvcmtvcy5nZXRcIiwge1xuICAgICAgXCJodHRwLm1ldGhvZFwiOiBcIkdFVFwiLFxuICAgICAgXCJodHRwLnBhdGhcIjogcGF0aCxcbiAgICB9KTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmlnaW5hbEdldChwYXRoLCBvcHRpb25zKTtcbiAgICAgIHRlbGVtZXRyeS5lbmRTcGFuKHNwYW5JZCwgU3BhblN0YXR1cy5PSyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0ZWxlbWV0cnkuZW5kU3BhbihcbiAgICAgICAgc3BhbklkLFxuICAgICAgICBTcGFuU3RhdHVzLkVSUk9SLFxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIHtcbiAgICAgICAgICBcImVycm9yLnR5cGVcIjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgPyBlcnJvci5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgICAgICA6IFwiVW5rbm93blwiLFxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfTtcblxuICB3b3Jrb3MucG9zdCA9IGFzeW5jIChwYXRoLCBlbnRpdHksIG9wdGlvbnMgPSB7fSkgPT4ge1xuICAgIGNvbnN0IHNwYW5JZCA9IHRlbGVtZXRyeS5zdGFydFNwYW4oXCJ3b3Jrb3MucG9zdFwiLCB7XG4gICAgICBcImh0dHAubWV0aG9kXCI6IFwiUE9TVFwiLFxuICAgICAgXCJodHRwLnBhdGhcIjogcGF0aCxcbiAgICB9KTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmlnaW5hbFBvc3QocGF0aCwgZW50aXR5LCBvcHRpb25zKTtcbiAgICAgIHRlbGVtZXRyeS5lbmRTcGFuKHNwYW5JZCwgU3BhblN0YXR1cy5PSyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0ZWxlbWV0cnkuZW5kU3BhbihcbiAgICAgICAgc3BhbklkLFxuICAgICAgICBTcGFuU3RhdHVzLkVSUk9SLFxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIHtcbiAgICAgICAgICBcImVycm9yLnR5cGVcIjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgPyBlcnJvci5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgICAgICA6IFwiVW5rbm93blwiLFxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfTtcblxuICB3b3Jrb3MucHV0ID0gYXN5bmMgKHBhdGgsIGVudGl0eSwgb3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgY29uc3Qgc3BhbklkID0gdGVsZW1ldHJ5LnN0YXJ0U3BhbihcIndvcmtvcy5wdXRcIiwge1xuICAgICAgXCJodHRwLm1ldGhvZFwiOiBcIlBVVFwiLFxuICAgICAgXCJodHRwLnBhdGhcIjogcGF0aCxcbiAgICB9KTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmlnaW5hbFB1dChwYXRoLCBlbnRpdHksIG9wdGlvbnMpO1xuICAgICAgdGVsZW1ldHJ5LmVuZFNwYW4oc3BhbklkLCBTcGFuU3RhdHVzLk9LKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRlbGVtZXRyeS5lbmRTcGFuKFxuICAgICAgICBzcGFuSWQsXG4gICAgICAgIFNwYW5TdGF0dXMuRVJST1IsXG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAge1xuICAgICAgICAgIFwiZXJyb3IudHlwZVwiOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICA/IGVycm9yLmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgICAgIDogXCJVbmtub3duXCIsXG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9O1xuXG4gIHdvcmtvcy5kZWxldGUgPSBhc3luYyAocGF0aCwgcXVlcnkpID0+IHtcbiAgICBjb25zdCBzcGFuSWQgPSB0ZWxlbWV0cnkuc3RhcnRTcGFuKFwid29ya29zLmRlbGV0ZVwiLCB7XG4gICAgICBcImh0dHAubWV0aG9kXCI6IFwiREVMRVRFXCIsXG4gICAgICBcImh0dHAucGF0aFwiOiBwYXRoLFxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG9yaWdpbmFsRGVsZXRlKHBhdGgsIHF1ZXJ5KTtcbiAgICAgIHRlbGVtZXRyeS5lbmRTcGFuKHNwYW5JZCwgU3BhblN0YXR1cy5PSyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRlbGVtZXRyeS5lbmRTcGFuKFxuICAgICAgICBzcGFuSWQsXG4gICAgICAgIFNwYW5TdGF0dXMuRVJST1IsXG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAge1xuICAgICAgICAgIFwiZXJyb3IudHlwZVwiOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICA/IGVycm9yLmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgICAgIDogXCJVbmtub3duXCIsXG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIEluc3RydW1lbnRzIHRoZSBTU08gbW9kdWxlIHdpdGggdGVsZW1ldHJ5XG4gKiBAcGFyYW0gc3NvIC0gVGhlIFNTTyBpbnN0YW5jZSB0byBpbnN0cnVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnN0cnVtZW50U1NPKHNzbzogU1NPKTogdm9pZCB7XG4gIC8vIFN0b3JlIG9yaWdpbmFsIG1ldGhvZHNcbiAgY29uc3Qgb3JpZ2luYWxHZXRBdXRob3JpemF0aW9uVXJsID0gc3NvLmdldEF1dGhvcml6YXRpb25VcmwuYmluZChzc28pO1xuICBjb25zdCBvcmlnaW5hbEdldFByb2ZpbGUgPSBzc28uZ2V0UHJvZmlsZS5iaW5kKHNzbyk7XG5cbiAgLy8gUmVwbGFjZSB3aXRoIGluc3RydW1lbnRlZCB2ZXJzaW9uc1xuICBzc28uZ2V0QXV0aG9yaXphdGlvblVybCA9IChvcHRpb25zKSA9PiB7XG4gICAgY29uc3Qgc3BhbklkID0gdGVsZW1ldHJ5LnN0YXJ0U3BhbihcInNzby5nZXRBdXRob3JpemF0aW9uVXJsXCIsIHtcbiAgICAgIFwid29ya29zLm1vZHVsZVwiOiBcInNzb1wiLFxuICAgICAgLi4ub3B0aW9ucy5jb25uZWN0aW9uID8geyBcInNzby5jb25uZWN0aW9uXCI6IG9wdGlvbnMuY29ubmVjdGlvbiB9IDoge30sXG4gICAgICAuLi5vcHRpb25zLm9yZ2FuaXphdGlvblxuICAgICAgICA/IHsgXCJzc28ub3JnYW5pemF0aW9uXCI6IG9wdGlvbnMub3JnYW5pemF0aW9uIH1cbiAgICAgICAgOiB7fSxcbiAgICAgIC4uLm9wdGlvbnMuZG9tYWluID8geyBcInNzby5kb21haW5cIjogb3B0aW9ucy5kb21haW4gfSA6IHt9LFxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsR2V0QXV0aG9yaXphdGlvblVybChvcHRpb25zKTtcbiAgICAgIHRlbGVtZXRyeS5lbmRTcGFuKHNwYW5JZCwgU3BhblN0YXR1cy5PSyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0ZWxlbWV0cnkuZW5kU3BhbihcbiAgICAgICAgc3BhbklkLFxuICAgICAgICBTcGFuU3RhdHVzLkVSUk9SLFxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICApO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9O1xuXG4gIHNzby5nZXRQcm9maWxlID0gYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgICBjb25zdCBzcGFuSWQgPSB0ZWxlbWV0cnkuc3RhcnRTcGFuKFwic3NvLmdldFByb2ZpbGVcIiwge1xuICAgICAgXCJ3b3Jrb3MubW9kdWxlXCI6IFwic3NvXCIsXG4gICAgfSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgb3JpZ2luYWxHZXRQcm9maWxlKG9wdGlvbnMpO1xuICAgICAgdGVsZW1ldHJ5LmVuZFNwYW4oc3BhbklkLCBTcGFuU3RhdHVzLk9LKTtcbiAgICAgIHRlbGVtZXRyeS5yZWNvcmRNZXRyaWMoXCJzc28ucHJvZmlsZV9yZXF1ZXN0c1wiLCAxLCBcImNvdW50ZXJcIiwge1xuICAgICAgICBcInJlc3VsdFwiOiBcInN1Y2Nlc3NcIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGVsZW1ldHJ5LmVuZFNwYW4oXG4gICAgICAgIHNwYW5JZCxcbiAgICAgICAgU3BhblN0YXR1cy5FUlJPUixcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgKTtcbiAgICAgIHRlbGVtZXRyeS5yZWNvcmRNZXRyaWMoXCJzc28ucHJvZmlsZV9yZXF1ZXN0c1wiLCAxLCBcImNvdW50ZXJcIiwge1xuICAgICAgICBcInJlc3VsdFwiOiBcImZhaWx1cmVcIixcbiAgICAgICAgXCJlcnJvci50eXBlXCI6IGVycm9yIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICA/IGVycm9yLmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgICAgICA6IFwiVW5rbm93blwiLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogSW5zdHJ1bWVudHMgdGhlIERpcmVjdG9yeVN5bmMgbW9kdWxlIHdpdGggdGVsZW1ldHJ5XG4gKiBAcGFyYW0gZGlyZWN0b3J5U3luYyAtIFRoZSBEaXJlY3RvcnlTeW5jIGluc3RhbmNlIHRvIGluc3RydW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RydW1lbnREaXJlY3RvcnlTeW5jKGRpcmVjdG9yeVN5bmM6IERpcmVjdG9yeVN5bmMpOiB2b2lkIHtcbiAgLy8gU3RvcmUgb3JpZ2luYWwgbWV0aG9kc1xuICBjb25zdCBvcmlnaW5hbExpc3RVc2VycyA9IGRpcmVjdG9yeVN5bmMubGlzdFVzZXJzLmJpbmQoZGlyZWN0b3J5U3luYyk7XG5cbiAgLy8gUmVwbGFjZSB3aXRoIGluc3RydW1lbnRlZCB2ZXJzaW9uc1xuICBkaXJlY3RvcnlTeW5jLmxpc3RVc2VycyA9IGFzeW5jIChvcHRpb25zID0ge30pID0+IHtcbiAgICBjb25zdCBzcGFuSWQgPSB0ZWxlbWV0cnkuc3RhcnRTcGFuKFwiZGlyZWN0b3J5U3luYy5saXN0VXNlcnNcIiwge1xuICAgICAgXCJ3b3Jrb3MubW9kdWxlXCI6IFwiZGlyZWN0b3J5U3luY1wiLFxuICAgICAgLi4ub3B0aW9ucy5kaXJlY3RvcnlcbiAgICAgICAgPyB7IFwiZGlyZWN0b3J5U3luYy5kaXJlY3RvcnlcIjogb3B0aW9ucy5kaXJlY3RvcnkgfVxuICAgICAgICA6IHt9LFxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9yaWdpbmFsTGlzdFVzZXJzKG9wdGlvbnMpO1xuICAgICAgdGVsZW1ldHJ5LmVuZFNwYW4oc3BhbklkLCBTcGFuU3RhdHVzLk9LLCB1bmRlZmluZWQsIHtcbiAgICAgICAgXCJyZXN1bHQuY291bnRcIjogcmVzdWx0LmRhdGEubGVuZ3RoLFxuICAgICAgfSk7XG4gICAgICB0ZWxlbWV0cnkucmVjb3JkTWV0cmljKFwiZGlyZWN0b3J5X3N5bmMudXNlcl9xdWVyaWVzXCIsIDEsIFwiY291bnRlclwiKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRlbGVtZXRyeS5lbmRTcGFuKFxuICAgICAgICBzcGFuSWQsXG4gICAgICAgIFNwYW5TdGF0dXMuRVJST1IsXG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogSW5zdHJ1bWVudHMgdGhlIFVzZXJNYW5hZ2VtZW50IG1vZHVsZSB3aXRoIHRlbGVtZXRyeVxuICogQHBhcmFtIHVzZXJNYW5hZ2VtZW50IC0gVGhlIFVzZXJNYW5hZ2VtZW50IGluc3RhbmNlIHRvIGluc3RydW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RydW1lbnRVc2VyTWFuYWdlbWVudCh1c2VyTWFuYWdlbWVudDogVXNlck1hbmFnZW1lbnQpOiB2b2lkIHtcbiAgLy8gU3RvcmUgb3JpZ2luYWwgbWV0aG9kc1xuICBjb25zdCBvcmlnaW5hbEF1dGhlbnRpY2F0ZVdpdGhQYXNzd29yZCA9IHVzZXJNYW5hZ2VtZW50XG4gICAgLmF1dGhlbnRpY2F0ZVdpdGhQYXNzd29yZC5iaW5kKHVzZXJNYW5hZ2VtZW50KTtcblxuICAvLyBSZXBsYWNlIHdpdGggaW5zdHJ1bWVudGVkIHZlcnNpb25zXG4gIHVzZXJNYW5hZ2VtZW50LmF1dGhlbnRpY2F0ZVdpdGhQYXNzd29yZCA9IGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgY29uc3Qgc3BhbklkID0gdGVsZW1ldHJ5LnN0YXJ0U3BhbihcbiAgICAgIFwidXNlck1hbmFnZW1lbnQuYXV0aGVudGljYXRlV2l0aFBhc3N3b3JkXCIsXG4gICAgICB7XG4gICAgICAgIFwid29ya29zLm1vZHVsZVwiOiBcInVzZXJNYW5hZ2VtZW50XCIsXG4gICAgICAgIFwiYXV0aC5tZXRob2RcIjogXCJwYXNzd29yZFwiLFxuICAgICAgICAuLi5vcHRpb25zLmVtYWlsXG4gICAgICAgICAgPyB7IFwidXNlci5lbWFpbF9kb21haW5cIjogb3B0aW9ucy5lbWFpbC5zcGxpdChcIkBcIilbMV0gfVxuICAgICAgICAgIDoge30sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgb3JpZ2luYWxBdXRoZW50aWNhdGVXaXRoUGFzc3dvcmQob3B0aW9ucyk7XG4gICAgICB0ZWxlbWV0cnkuZW5kU3BhbihzcGFuSWQsIFNwYW5TdGF0dXMuT0spO1xuICAgICAgdGVsZW1ldHJ5LnJlY29yZE1ldHJpYyhcbiAgICAgICAgXCJ1c2VyX21hbmFnZW1lbnQuYXV0aGVudGljYXRpb25fYXR0ZW1wdHNcIixcbiAgICAgICAgMSxcbiAgICAgICAgXCJjb3VudGVyXCIsXG4gICAgICAgIHtcbiAgICAgICAgICBcImF1dGgubWV0aG9kXCI6IFwicGFzc3dvcmRcIixcbiAgICAgICAgICBcInJlc3VsdFwiOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0ZWxlbWV0cnkuZW5kU3BhbihcbiAgICAgICAgc3BhbklkLFxuICAgICAgICBTcGFuU3RhdHVzLkVSUk9SLFxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICApO1xuICAgICAgdGVsZW1ldHJ5LnJlY29yZE1ldHJpYyhcbiAgICAgICAgXCJ1c2VyX21hbmFnZW1lbnQuYXV0aGVudGljYXRpb25fYXR0ZW1wdHNcIixcbiAgICAgICAgMSxcbiAgICAgICAgXCJjb3VudGVyXCIsXG4gICAgICAgIHtcbiAgICAgICAgICBcImF1dGgubWV0aG9kXCI6IFwicGFzc3dvcmRcIixcbiAgICAgICAgICBcInJlc3VsdFwiOiBcImZhaWx1cmVcIixcbiAgICAgICAgICBcImVycm9yLnR5cGVcIjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgPyBlcnJvci5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAgICAgICA6IFwiVW5rbm93blwiLFxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Q0FLQyxHQUVELFNBQVMsVUFBVSxFQUFFLFNBQVMsUUFBUSx5QkFBeUI7QUFNL0Q7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLHFCQUFxQixNQUFjO0VBQ2pELDZCQUE2QjtFQUM3QixNQUFNLGNBQWMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO0VBQ3BDLE1BQU0sZUFBZSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7RUFDdEMsTUFBTSxjQUFjLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztFQUNwQyxNQUFNLGlCQUFpQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUM7RUFFMUMscUNBQXFDO0VBQ3JDLE9BQU8sR0FBRyxHQUFHLE9BQU8sTUFBTSxVQUFVLENBQUMsQ0FBQztJQUNwQyxNQUFNLFNBQVMsVUFBVSxTQUFTLENBQUMsY0FBYztNQUMvQyxlQUFlO01BQ2YsYUFBYTtJQUNmO0lBRUEsSUFBSTtNQUNGLE1BQU0sU0FBUyxNQUFNLFlBQVksTUFBTTtNQUN2QyxVQUFV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
// denoCacheMetadata=18095986926881964394,12187180735581864484