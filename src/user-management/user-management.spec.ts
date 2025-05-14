// Import Deno standard testing library
import { assertEquals } from "@std/assert";

import {
  fetchBody,
  fetchOnce,
  fetchSearchParams,
  fetchURL,
  resetMockFetch,
} from "../common/utils/test-utils.ts";
import { WorkOS } from "../workos.ts";

// Import only needed fixtures
const userFixture = {
  "object": "user",
  "id": "user_01H5JQDV7R7ATEYZDEG0W5PRYS",
  "email": "test01@example.com",
  "first_name": "Test 01",
  "last_name": "User",
  "created_at": "2023-07-18T02:07:19.911Z",
  "updated_at": "2023-07-18T02:07:19.911Z",
  "email_verified": true,
  "profile_picture_url": "https://example.com/profile_picture.jpg",
  "last_sign_in_at": "2023-07-18T02:07:19.911Z",
  "metadata": { "key": "value" },
};

const listUsersFixture = {
  "object": "list",
  "data": [
    {
      "object": "user",
      "id": "user_01H5JQDV7R7ATEYZDEG0W5PRYS",
      "email": "test01@example.com",
    },
  ],
  "list_metadata": {
    "before": null,
    "after": null,
  },
};

const userId = "user_01H5JQDV7R7ATEYZDEG0W5PRYS";

// Setup function to reset mock fetch and create WorkOS instance
function setup() {
  resetMockFetch();
  return new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU", {
    apiHostname: "api.workos.test",
    clientId: "proj_123",
  });
}

// UserManagement - getUser sends a Get User request
Deno.test("UserManagement - getUser sends a Get User request", async () => {
  const workos = setup();

  fetchOnce(userFixture);
  const user = await workos.userManagement.getUser(userId);

  assertEquals(fetchURL()?.includes(`/user_management/users/${userId}`), true);
  assertEquals(user.object, "user");
  assertEquals(user.id, "user_01H5JQDV7R7ATEYZDEG0W5PRYS");
  assertEquals(user.email, "test01@example.com");
  assertEquals(
    user.profilePictureUrl,
    "https://example.com/profile_picture.jpg",
  );
  assertEquals(user.firstName, "Test 01");
  assertEquals(user.lastName, "User");
  assertEquals(user.emailVerified, true);
  assertEquals(user.lastSignInAt, "2023-07-18T02:07:19.911Z");
});

// UserManagement - getUserByExternalId sends a Get User request
Deno.test("UserManagement - getUserByExternalId sends a Get User request", async () => {
  const workos = setup();

  const externalId = "user_external_id";
  fetchOnce({ ...userFixture, external_id: externalId });

  const user = await workos.userManagement.getUserByExternalId(externalId);
  assertEquals(
    fetchURL()?.includes(`/user_management/users/external_id/${externalId}`),
    true,
  );
  assertEquals(user.object, "user");
  assertEquals(user.id, "user_01H5JQDV7R7ATEYZDEG0W5PRYS");
  assertEquals(user.email, "test01@example.com");
  assertEquals(
    user.profilePictureUrl,
    "https://example.com/profile_picture.jpg",
  );
  assertEquals(user.firstName, "Test 01");
  assertEquals(user.lastName, "User");
  assertEquals(user.emailVerified, true);
  assertEquals(user.lastSignInAt, "2023-07-18T02:07:19.911Z");
  assertEquals(user.externalId, externalId);
});

// UserManagement - listUsers lists users
Deno.test("UserManagement - listUsers lists users", async () => {
  const workos = setup();

  fetchOnce(listUsersFixture);
  const userList = await workos.userManagement.listUsers();

  assertEquals(fetchURL()?.includes("/user_management/users"), true);
  assertEquals(userList.object, "list");
  assertEquals(userList.data[0].object, "user");
  assertEquals(userList.data[0].email, "test01@example.com");
  assertEquals(userList.listMetadata.before, null);
  assertEquals(userList.listMetadata.after, null);
});

// UserManagement - listUsers sends the correct params when filtering
Deno.test("UserManagement - listUsers sends the correct params when filtering", async () => {
  const workos = setup();

  fetchOnce(listUsersFixture);
  await workos.userManagement.listUsers({
    email: "foo@example.com",
    organizationId: "org_someorg",
    after: "user_01H5JQDV7R7ATEYZDEG0W5PRYS",
    limit: 10,
  });

  const params = fetchSearchParams();
  assertEquals(params?.email, "foo@example.com");
  assertEquals(params?.organization_id, "org_someorg");
  assertEquals(params?.after, "user_01H5JQDV7R7ATEYZDEG0W5PRYS");
  assertEquals(params?.limit, "10");
  assertEquals(params?.order, "desc");
});

// UserManagement - createUser sends a Create User request
Deno.test("UserManagement - createUser sends a Create User request", async () => {
  const workos = setup();

  fetchOnce(userFixture);
  const user = await workos.userManagement.createUser({
    email: "test01@example.com",
    password: "extra-secure",
    firstName: "Test 01",
    lastName: "User",
    emailVerified: true,
  });

  assertEquals(fetchURL()?.includes("/user_management/users"), true);
  assertEquals(user.object, "user");
  assertEquals(user.email, "test01@example.com");
  assertEquals(user.firstName, "Test 01");
  assertEquals(user.lastName, "User");
  assertEquals(user.emailVerified, true);
  assertEquals(
    user.profilePictureUrl,
    "https://example.com/profile_picture.jpg",
  );
  assertEquals(user.createdAt, "2023-07-18T02:07:19.911Z");
  assertEquals(user.updatedAt, "2023-07-18T02:07:19.911Z");
});

// UserManagement - createUser adds metadata to the request
Deno.test("UserManagement - createUser adds metadata to the request", async () => {
  const workos = setup();

  fetchOnce(userFixture);
  await workos.userManagement.createUser({
    email: "test01@example.com",
    metadata: { key: "value" },
  });

  const body = fetchBody();
  assertEquals((body as Record<string, unknown>).metadata, { key: "value" });
});

// UserManagement - getAuthorizationUrl with screenHint
Deno.test("UserManagement - getAuthorizationUrl with screenHint generates an authorize url with a screenHint", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  const url = workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    clientId: "proj_123",
    redirectUri: "example.com/auth/workos/callback",
    screenHint: "sign-up",
  });

  const expectedUrl =
    "https://api.workos.com/user_management/authorize?client_id=proj_123&provider=authkit&" +
    "redirect_uri=example.com%2Fauth%2Fworkos%2Fcallback&response_type=code&screen_hint=sign-up";

  assertEquals(url, expectedUrl);
});

// UserManagement - getAuthorizationUrl with code_challenge
Deno.test("UserManagement - getAuthorizationUrl with code_challenge and code_challenge_method generates an authorize url", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  const url = workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    clientId: "proj_123",
    redirectUri: "example.com/auth/workos/callback",
    codeChallenge: "code_challenge_value",
    codeChallengeMethod: "S256",
  });

  const expectedUrl =
    "https://api.workos.com/user_management/authorize?client_id=proj_123&" +
    "code_challenge=code_challenge_value&code_challenge_method=S256&provider=authkit&" +
    "redirect_uri=example.com%2Fauth%2Fworkos%2Fcallback&response_type=code";

  assertEquals(url, expectedUrl);
});

// UserManagement - getAuthorizationUrl with default api hostname
Deno.test("UserManagement - getAuthorizationUrl with no custom api hostname generates an authorize url with the default api hostname", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  const url = workos.userManagement.getAuthorizationUrl({
    provider: "Google",
    clientId: "proj_123",
    redirectUri: "example.com/auth/workos/callback",
  });

  const expectedUrl =
    "https://api.workos.com/user_management/authorize?client_id=proj_123&provider=Google&" +
    "redirect_uri=example.com%2Fauth%2Fworkos%2Fcallback&response_type=code";

  assertEquals(url, expectedUrl);
});

// UserManagement - getAuthorizationUrl with no domain or provider throws error
Deno.test("UserManagement - getAuthorizationUrl with no domain or provider throws an error for incomplete arguments", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  try {
    workos.userManagement.getAuthorizationUrl({
      clientId: "proj_123",
      redirectUri: "example.com/auth/workos/callback",
    });
    throw new Error("Expected to throw but did not");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals(
      (error as Error).message.includes("Incomplete arguments"),
      true,
    );
  }
});

// UserManagement - getLogoutUrl returns a logout url
Deno.test("UserManagement - getLogoutUrl returns a logout url", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  const url = workos.userManagement.getLogoutUrl({
    sessionId: "123456",
  });

  assertEquals(
    url,
    "https://api.workos.com/user_management/sessions/logout?session_id=123456",
  );
});

// UserManagement - getLogoutUrl with returnTo includes a return_to in the URL
Deno.test("UserManagement - getLogoutUrl with returnTo includes a return_to in the URL", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  const url = workos.userManagement.getLogoutUrl({
    sessionId: "123456",
    returnTo: "https://your-app.com/signed-out",
  });

  assertEquals(
    url,
    "https://api.workos.com/user_management/sessions/logout?session_id=123456&" +
      "return_to=https%3A%2F%2Fyour-app.com%2Fsigned-out",
  );
});

// UserManagement - getJwksUrl returns the jwks url
Deno.test("UserManagement - getJwksUrl returns the jwks url", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  const url = workos.userManagement.getJwksUrl("client_whatever");

  assertEquals(url, "https://api.workos.com/sso/jwks/client_whatever");
});

// UserManagement - getJwksUrl throws an error if the clientId is blank
Deno.test("UserManagement - getJwksUrl throws an error if the clientId is blank", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

  try {
    workos.userManagement.getJwksUrl("");
    throw new Error("Expected to throw but did not");
  } catch (error) {
    assertEquals(error instanceof TypeError, true);
  }
});
