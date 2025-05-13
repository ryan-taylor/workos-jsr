// Import standard Deno assertions
import { assertEquals } from "@std/assert";

import {
  fetchOnce,
  fetchSearchParams,
  fetchURL,
  resetMockFetch,
} from "../common/utils/test-utils.ts.ts";
import { WorkOS } from "../workos.ts.ts";
import type {
  Directory,
  DirectoryGroup,
  DirectoryGroupResponse,
  DirectoryResponse,
  DirectoryUserWithGroups,
  DirectoryUserWithGroupsResponse,
} from "./interfaces/index.ts.ts";

// Define common test data
const directory: Directory = {
  id: "directory_123",
  createdAt: "2020-05-06 04:21:48.649164",
  domain: "foo-corp.com",
  externalKey: "9asBRBVHz2ASEkgg",
  name: "Foo",
  object: "directory",
  organizationId: "org_01EXSR7M9QTKCC5D531SMCWMYG",
  state: "active",
  type: "okta scim v2.0",
  updatedAt: "2021-12-13 12:15:45.531847",
};

const directoryResponse: DirectoryResponse = {
  id: "directory_123",
  created_at: "2020-05-06 04:21:48.649164",
  domain: "foo-corp.com",
  external_key: "9asBRBVHz2ASEkgg",
  name: "Foo",
  object: "directory",
  organization_id: "org_01EXSR7M9QTKCC5D531SMCWMYG",
  state: "linked",
  type: "okta scim v2.0",
  updated_at: "2021-12-13 12:15:45.531847",
};

const group: DirectoryGroup = {
  id: "dir_grp_123",
  idpId: "123",
  directoryId: "dir_123",
  organizationId: "org_123",
  name: "Foo Group",
  createdAt: "2021-10-27 15:21:50.640958",
  updatedAt: "2021-12-13 12:15:45.531847",
  rawAttributes: {
    foo: "bar",
  },
};

const groupResponse: DirectoryGroupResponse = {
  id: "dir_grp_123",
  idp_id: "123",
  directory_id: "dir_123",
  organization_id: "org_123",
  name: "Foo Group",
  created_at: "2021-10-27 15:21:50.640958",
  updated_at: "2021-12-13 12:15:45.531847",
  raw_attributes: {
    foo: "bar",
  },
};

const userWithGroup: DirectoryUserWithGroups = {
  object: "directory_user",
  id: "user_123",
  customAttributes: {
    custom: true,
  },
  directoryId: "dir_123",
  organizationId: "org_123",
  email: "jonsnow@workos.com",
  emails: [
    {
      primary: true,
      type: "type",
      value: "jonsnow@workos.com",
    },
  ],
  firstName: "Jon",
  groups: [group],
  idpId: "idp_foo",
  lastName: "Snow",
  jobTitle: "Knight of the Watch",
  rawAttributes: {},
  state: "active",
  username: "jonsnow",
  createdAt: "2021-10-27 15:21:50.640959",
  updatedAt: "2021-12-13 12:15:45.531847",
};

const userWithGroupResponse: DirectoryUserWithGroupsResponse = {
  object: "directory_user",
  id: "user_123",
  custom_attributes: {
    custom: true,
  },
  directory_id: "dir_123",
  organization_id: "org_123",
  email: "jonsnow@workos.com",
  emails: [
    {
      primary: true,
      type: "type",
      value: "jonsnow@workos.com",
    },
  ],
  first_name: "Jon",
  groups: [groupResponse],
  idp_id: "idp_foo",
  last_name: "Snow",
  job_title: "Knight of the Watch",
  raw_attributes: {},
  state: "active",
  username: "jonsnow",
  created_at: "2021-10-27 15:21:50.640959",
  updated_at: "2021-12-13 12:15:45.531847",
};

const userWithRole: DirectoryUserWithGroups = {
  object: "directory_user",
  id: "directory_user_456",
  customAttributes: {
    custom: true,
  },
  directoryId: "dir_123",
  organizationId: "org_123",
  email: "jonsnow@workos.com",
  emails: [
    {
      primary: true,
      type: "type",
      value: "jonsnow@workos.com",
    },
  ],
  firstName: "Jon",
  groups: [group],
  idpId: "idp_foo",
  lastName: "Snow",
  jobTitle: "Knight of the Watch",
  rawAttributes: {},
  state: "active",
  username: "jonsnow",
  role: { slug: "super_admin" },
  createdAt: "2021-10-27 15:21:50.640959",
  updatedAt: "2021-12-13 12:15:45.531847",
};

const userWithRoleResponse: DirectoryUserWithGroupsResponse = {
  object: "directory_user",
  id: "directory_user_456",
  custom_attributes: {
    custom: true,
  },
  directory_id: "dir_123",
  organization_id: "org_123",
  email: "jonsnow@workos.com",
  emails: [
    {
      primary: true,
      type: "type",
      value: "jonsnow@workos.com",
    },
  ],
  first_name: "Jon",
  groups: [groupResponse],
  idp_id: "idp_foo",
  last_name: "Snow",
  job_title: "Knight of the Watch",
  raw_attributes: {},
  state: "active",
  username: "jonsnow",
  role: { slug: "super_admin" },
  created_at: "2021-10-27 15:21:50.640959",
  updated_at: "2021-12-13 12:15:45.531847",
};

// Helper function for setup
function setupTest() {
  resetMockFetch();
  return new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");
}

Deno.test("DirectorySync - listDirectories with options requests Directories with query parameters", async () => {
  const workos = setupTest();

  const directoryListResponse = {
    object: "list",
    data: [directoryResponse],
    list_metadata: {},
  };

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(directoryListResponse));

  const subject = await workos.directorySync.listDirectories({
    organizationId: "org_1234",
  });

  const params = fetchSearchParams();
  assertEquals(params.organization_id, "org_1234");

  // Check that subject has the expected structure
  assertEquals(subject.object, "list");
  assertEquals(subject.data[0].id, directory.id);
  assertEquals(subject.data[0].name, directory.name);
});

Deno.test("DirectorySync - getDirectory requests a Directory", async () => {
  const workos = setupTest();

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(directoryResponse));

  const subject = await workos.directorySync.getDirectory("directory_123");

  assertEquals(subject, directory);
});

Deno.test("DirectorySync - deleteDirectory sends a request to delete the directory", async () => {
  const workos = setupTest();

  fetchOnce({}, { status: 202 });

  await workos.directorySync.deleteDirectory("directory_123");

  const url = fetchURL();
  assertEquals(typeof url, "string");
  assertEquals(url?.includes("/directories/directory_123"), true);
});

Deno.test("DirectorySync - getGroup requests a Directory Group", async () => {
  const workos = setupTest();

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(groupResponse));

  const subject = await workos.directorySync.getGroup("dir_grp_123");

  assertEquals(subject, group);
});

Deno.test("DirectorySync - listGroups with a Directory requests a Directory's Groups", async () => {
  const workos = setupTest();

  const groupListResponse = {
    object: "list",
    data: [groupResponse],
    list_metadata: {},
  };

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(groupListResponse));

  const subject = await workos.directorySync.listGroups({
    directory: "directory_123",
  });

  const params = fetchSearchParams();
  assertEquals(params.directory, "directory_123");

  // Check that subject has the expected structure
  assertEquals(subject.object, "list");
  assertEquals(subject.data[0].id, group.id);
  assertEquals(subject.data[0].name, group.name);
  assertEquals(subject.options?.directory, "directory_123");
});

Deno.test("DirectorySync - listGroups with a User requests a Directory's Groups", async () => {
  const workos = setupTest();

  const groupListResponse = {
    object: "list",
    data: [groupResponse],
    list_metadata: {},
  };

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(groupListResponse));

  const subject = await workos.directorySync.listGroups({
    user: "directory_usr_123",
  });

  const params = fetchSearchParams();
  assertEquals(params.user, "directory_usr_123");

  // Check that subject has the expected structure
  assertEquals(subject.object, "list");
  assertEquals(subject.data[0].id, group.id);
  assertEquals(subject.data[0].name, group.name);
  assertEquals(subject.options?.user, "directory_usr_123");
});

Deno.test("DirectorySync - listUsers with a Directory requests a Directory's Users", async () => {
  const workos = setupTest();

  const userWithGroupListResponse = {
    object: "list",
    data: [userWithGroupResponse],
    list_metadata: {},
  };

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(userWithGroupListResponse));

  const subject = await workos.directorySync.listUsers({
    directory: "directory_123",
  });

  const params = fetchSearchParams();
  assertEquals(params.directory, "directory_123");

  // Check that subject has the expected structure
  assertEquals(subject.object, "list");
  assertEquals(subject.data[0].id, userWithGroup.id);
  assertEquals(subject.data[0].firstName, userWithGroup.firstName);
  assertEquals(subject.options?.directory, "directory_123");
});

Deno.test("DirectorySync - listUsers with custom attributes returns the custom attributes, using the provided type", async () => {
  const workos = setupTest();

  interface MyCustomAttributes {
    managerId: string;
  }

  fetchOnce(
    JSON.stringify({
      data: [
        {
          object: "directory_user",
          id: "directory_user_01FBSYNGBVB4Q0GE4PJR328QB6",
          directory_id: "directory_01FBSYNGBN6R6WRMQM47PRCVMH",
          idp_id: "d899102f-86ad-4c14-9629-cd478b6a1971",
          username: "Virginia.Stoltenberg92",
          emails: [],
          first_name: "Virginia",
          last_name: "Stoltenberg",
          job_title: "Software Engineer",
          state: "active",
          created_at: "2021-10-27 15:21:50.640959",
          updated_at: "2021-12-13 12:15:45.531847",
          raw_attributes: {},
          custom_attributes: {
            managerId: "99f1817b-149c-4438-b80f-a272c3406109",
          },
          groups: [
            {
              object: "directory_group",
              id: "directory_group_01FBSYNGC0ASXP1WPA32AF8430",
              directory_id: "directory_01FBSYNGBN6R6WRMQM47PRCVMH",
              name: "Strosin, Luettgen and Halvorson",
              raw_attributes: {},
            },
          ],
        },
        {
          object: "directory_user",
          id: "directory_user_01FBSYQPYWG0SMTGRFFDS5FRQ9",
          directory_id: "directory_01FBSYQPYN2XMDN7BQHP490M03",
          idp_id: "044d1610-7b9f-47bf-8269-9a5774a7a0d7",
          username: "Eli.Leffler",
          emails: [],
          first_name: "Eli",
          last_name: "Leffler",
          job_title: "Software Engineer",
          state: "active",
          created_at: "2021-10-27 15:21:50.640959",
          updated_at: "2021-12-13 12:15:45.531847",
          raw_attributes: {},
          custom_attributes: {
            managerId: "263c7472-4d3f-4ab4-8162-e768af103065",
          },
          groups: [
            {
              object: "directory_group",
              id: "directory_group_01FBSYQPZ101G15H9VJ5AM35Y3",
              directory_id: "directory_01FBSYQPYN2XMDN7BQHP490M03",
              name: "Osinski, Bauch and Rice",
              raw_attributes: {},
            },
          ],
        },
      ],
    }),
    { status: 200 },
  );

  const users = await workos.directorySync.listUsers<MyCustomAttributes>({
    directory: "directory_123",
  });

  const params = fetchSearchParams();
  assertEquals(params.directory, "directory_123");

  const managerIds = users.data.map(
    (user) => user.customAttributes.managerId,
  );

  assertEquals(managerIds, [
    "99f1817b-149c-4438-b80f-a272c3406109",
    "263c7472-4d3f-4ab4-8162-e768af103065",
  ]);
});

Deno.test("DirectorySync - listUsers with a Group requests a Directory's Users", async () => {
  const workos = setupTest();

  const userWithGroupListResponse = {
    object: "list",
    data: [userWithGroupResponse],
    list_metadata: {},
  };

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(userWithGroupListResponse));

  const subject = await workos.directorySync.listUsers({
    group: "directory_grp_123",
  });

  const params = fetchSearchParams();
  assertEquals(params.group, "directory_grp_123");

  // Check that subject has the expected structure
  assertEquals(subject.object, "list");
  assertEquals(subject.data[0].id, userWithGroup.id);
  assertEquals(subject.data[0].firstName, userWithGroup.firstName);
  assertEquals(subject.options?.group, "directory_grp_123");
});

Deno.test("DirectorySync - getUser requests a Directory User", async () => {
  const workos = setupTest();

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(userWithGroupResponse));

  const subject = await workos.directorySync.getUser("dir_usr_123");

  assertEquals(subject, userWithGroup);
});

Deno.test("DirectorySync - getUser with a Role requests a Directory User", async () => {
  const workos = setupTest();

  // Convert to string to avoid type issues
  fetchOnce(JSON.stringify(userWithRoleResponse));

  const subject = await workos.directorySync.getUser(
    "directory_user_456",
  );

  assertEquals(subject, userWithRole);
});
