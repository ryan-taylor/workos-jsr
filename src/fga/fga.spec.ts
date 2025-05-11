// Import Deno standard testing library
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';

import { fetchBody, fetchHeaders, fetchOnce, fetchSearchParams, fetchURL, resetMockFetch } from '../common/utils/test-utils.ts';

import { WorkOS } from '../workos.ts';
import { ResourceOp, WarrantOp } from './interfaces/index.ts';

const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

// Setup function to reset mock fetch before each test
function setup() {
  resetMockFetch();
}

// FGA - check
Deno.test('FGA - check makes check request', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    result: 'authorized',
    is_implicit: false,
    warrant_token: 'abc',
  }));
  
  const checkResult = await workos.fga.check({
    checks: [
      {
        resource: {
          resourceType: 'role',
          resourceId: 'admin',
        },
        relation: 'member',
        subject: {
          resourceType: 'user',
          resourceId: 'user_123',
        },
      },
    ],
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/check'), true);
  assertEquals(checkResult, {
    result: 'authorized',
    isImplicit: false,
    warrantToken: 'abc',
  });
});

// FGA - createResource
Deno.test('FGA - createResource creates resource', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    resource_type: 'role',
    resource_id: 'admin',
  }));
  
  const resource = await workos.fga.createResource({
    resource: {
      resourceType: 'role',
      resourceId: 'admin',
    },
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/resources'), true);
  assertEquals(resource, {
    resourceType: 'role',
    resourceId: 'admin',
  });
});

Deno.test('FGA - createResource creates resource with metadata', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    resource_type: 'role',
    resource_id: 'admin',
    meta: {
      description: 'The admin role',
    },
  }));
  
  const resource = await workos.fga.createResource({
    resource: {
      resourceType: 'role',
      resourceId: 'admin',
    },
    meta: {
      description: 'The admin role',
    },
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/resources'), true);
  assertEquals(resource, {
    resourceType: 'role',
    resourceId: 'admin',
    meta: {
      description: 'The admin role',
    },
  });
});

// FGA - getResource
Deno.test('FGA - getResource gets resource', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    resource_type: 'role',
    resource_id: 'admin',
  }));
  
  const resource = await workos.fga.getResource({
    resourceType: 'role',
    resourceId: 'admin',
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/resources/role/admin'), true);
  assertEquals(resource, {
    resourceType: 'role',
    resourceId: 'admin',
  });
});

// FGA - listResources
Deno.test('FGA - listResources lists resources', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    data: [
      {
        resource_type: 'role',
        resource_id: 'admin',
      },
      {
        resource_type: 'role',
        resource_id: 'manager',
      },
    ],
    list_metadata: {
      before: null,
      after: null,
    },
  }));
  
  const { data: resources } = await workos.fga.listResources();
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/resources'), true);
  assertEquals(resources, [
    {
      resourceType: 'role',
      resourceId: 'admin',
    },
    {
      resourceType: 'role',
      resourceId: 'manager',
    },
  ]);
});

Deno.test('FGA - listResources sends correct params when filtering', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    data: [
      {
        resource_type: 'role',
        resource_id: 'admin',
      },
      {
        resource_type: 'role',
        resource_id: 'manager',
      },
    ],
    list_metadata: {
      before: null,
      after: null,
    },
  }));
  
  await workos.fga.listResources({
    resourceType: 'role',
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/resources'), true);
  
  const params = fetchSearchParams();
  assertEquals(params.resource_type, 'role');
  assertEquals(params.order, 'desc');
});

// FGA - deleteResource
Deno.test('FGA - deleteResource should delete resource', async () => {
  setup();
  
  fetchOnce();
  
  const response = await workos.fga.deleteResource({
    resourceType: 'role',
    resourceId: 'admin',
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/resources/role/admin'), true);
  assertEquals(response, undefined);
});

// FGA - batchWriteResources
Deno.test('FGA - batchWriteResources batch create resources', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    data: [
      {
        resource_type: 'role',
        resource_id: 'admin',
        meta: {
          description: 'The admin role',
        },
      },
      {
        resource_type: 'role',
        resource_id: 'manager',
      },
      {
        resource_type: 'role',
        resource_id: 'employee',
      },
    ],
  }));
  
  const createdResources = await workos.fga.batchWriteResources({
    op: ResourceOp.Create,
    resources: [
      {
        resource: {
          resourceType: 'role',
          resourceId: 'admin',
        },
        meta: {
          description: 'The admin role',
        },
      },
      {
        resource: {
          resourceType: 'role',
          resourceId: 'manager',
        },
      },
      {
        resource: {
          resourceType: 'role',
          resourceId: 'employee',
        },
      },
    ],
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/resources/batch'), true);
  assertEquals(createdResources, [
    {
      resourceType: 'role',
      resourceId: 'admin',
      meta: {
        description: 'The admin role',
      },
    },
    {
      resourceType: 'role',
      resourceId: 'manager',
    },
    {
      resourceType: 'role',
      resourceId: 'employee',
    },
  ]);
});

Deno.test('FGA - batchWriteResources batch delete resources', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    data: [
      {
        resource_type: 'role',
        resource_id: 'admin',
      },
      {
        resource_type: 'role',
        resource_id: 'manager',
      },
      {
        resource_type: 'role',
        resource_id: 'employee',
      },
    ],
  }));
  
  const deletedResources = await workos.fga.batchWriteResources({
    op: ResourceOp.Delete,
    resources: [
      {
        resource: {
          resourceType: 'role',
          resourceId: 'admin',
        },
        meta: {
          description: 'The admin role',
        },
      },
      {
        resource: {
          resourceType: 'role',
          resourceId: 'manager',
        },
      },
      {
        resource: {
          resourceType: 'role',
          resourceId: 'employee',
        },
      },
    ],
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/resources/batch'), true);
  assertEquals(deletedResources, [
    {
      resourceType: 'role',
      resourceId: 'admin',
    },
    {
      resourceType: 'role',
      resourceId: 'manager',
    },
    {
      resourceType: 'role',
      resourceId: 'employee',
    },
  ]);
});

// FGA - writeWarrant
Deno.test('FGA - writeWarrant should create warrant with no op', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    warrant_token: 'some_token',
  }));
  
  const warrantToken = await workos.fga.writeWarrant({
    resource: {
      resourceType: 'role',
      resourceId: 'admin',
    },
    relation: 'member',
    subject: {
      resourceType: 'user',
      resourceId: 'user_123',
    },
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/warrants'), true);
  
  const body = fetchBody();
  assertEquals(body, {
    resource_type: 'role',
    resource_id: 'admin',
    relation: 'member',
    subject: {
      resource_type: 'user',
      resource_id: 'user_123',
    },
  });
  assertEquals(warrantToken, {
    warrantToken: 'some_token',
  });
});

Deno.test('FGA - writeWarrant should create warrant with create op', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    warrant_token: 'some_token',
  }));
  
  const warrantToken = await workos.fga.writeWarrant({
    op: WarrantOp.Create,
    resource: {
      resourceType: 'role',
      resourceId: 'admin',
    },
    relation: 'member',
    subject: {
      resourceType: 'user',
      resourceId: 'user_123',
    },
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/warrants'), true);
  
  const body = fetchBody();
  assertEquals(body, {
    op: 'create',
    resource_type: 'role',
    resource_id: 'admin',
    relation: 'member',
    subject: {
      resource_type: 'user',
      resource_id: 'user_123',
    },
  });
  assertEquals(warrantToken, {
    warrantToken: 'some_token',
  });
});

Deno.test('FGA - writeWarrant should delete warrant with delete op', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    warrant_token: 'some_token',
  }));
  
  const warrantToken = await workos.fga.writeWarrant({
    op: WarrantOp.Delete,
    resource: {
      resourceType: 'role',
      resourceId: 'admin',
    },
    relation: 'member',
    subject: {
      resourceType: 'user',
      resourceId: 'user_123',
    },
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/warrants'), true);
  
  const body = fetchBody();
  assertEquals(body, {
    op: 'delete',
    resource_type: 'role',
    resource_id: 'admin',
    relation: 'member',
    subject: {
      resource_type: 'user',
      resource_id: 'user_123',
    },
  });
  assertEquals(warrantToken, {
    warrantToken: 'some_token',
  });
});

// FGA - batchWriteWarrants
Deno.test('FGA - batchWriteWarrants should create warrants with no op or create op and delete warrants with delete op', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    warrant_token: 'some_token',
  }));
  
  const warrantToken = await workos.fga.batchWriteWarrants([
    {
      resource: {
        resourceType: 'role',
        resourceId: 'admin',
      },
      relation: 'member',
      subject: {
        resourceType: 'user',
        resourceId: 'user_123',
      },
    },
    {
      op: WarrantOp.Create,
      resource: {
        resourceType: 'role',
        resourceId: 'admin',
      },
      relation: 'member',
      subject: {
        resourceType: 'user',
        resourceId: 'user_124',
      },
    },
    {
      op: WarrantOp.Delete,
      resource: {
        resourceType: 'role',
        resourceId: 'admin',
      },
      relation: 'member',
      subject: {
        resourceType: 'user',
        resourceId: 'user_125',
      },
    },
  ]);
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/warrants'), true);
  
  const body = fetchBody();
  assertEquals(body, [
    {
      resource_type: 'role',
      resource_id: 'admin',
      relation: 'member',
      subject: {
        resource_type: 'user',
        resource_id: 'user_123',
      },
    },
    {
      op: 'create',
      resource_type: 'role',
      resource_id: 'admin',
      relation: 'member',
      subject: {
        resource_type: 'user',
        resource_id: 'user_124',
      },
    },
    {
      op: 'delete',
      resource_type: 'role',
      resource_id: 'admin',
      relation: 'member',
      subject: {
        resource_type: 'user',
        resource_id: 'user_125',
      },
    },
  ]);
  assertEquals(warrantToken, {
    warrantToken: 'some_token',
  });
});

// FGA - listWarrants
Deno.test('FGA - listWarrants should list warrants', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    data: [
      {
        resource_type: 'role',
        resource_id: 'admin',
        relation: 'member',
        subject: {
          resource_type: 'user',
          resource_id: 'user_123',
        },
      },
      {
        resource_type: 'role',
        resource_id: 'admin',
        relation: 'member',
        subject: {
          resource_type: 'user',
          resource_id: 'user_124',
        },
        policy: 'region == "us"',
      },
    ],
    list_metadata: {
      before: null,
      after: null,
    },
  }));
  
  const { data: warrants } = await workos.fga.listWarrants();
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/warrants'), true);
  assertEquals(warrants, [
    {
      resourceType: 'role',
      resourceId: 'admin',
      relation: 'member',
      subject: {
        resourceType: 'user',
        resourceId: 'user_123',
      },
    },
    {
      resourceType: 'role',
      resourceId: 'admin',
      relation: 'member',
      subject: {
        resourceType: 'user',
        resourceId: 'user_124',
      },
      policy: 'region == "us"',
    },
  ]);
});

Deno.test('FGA - listWarrants sends correct params when filtering', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    data: [
      {
        resource_type: 'role',
        resource_id: 'admin',
        relation: 'member',
        subject: {
          resource_type: 'user',
          resource_id: 'user_123',
        },
      },
    ],
    list_metadata: {
      before: null,
      after: null,
    },
  }));
  
  await workos.fga.listWarrants({
    subjectType: 'user',
    subjectId: 'user_123',
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/warrants'), true);
  
  const params = fetchSearchParams();
  assertEquals(params.subject_type, 'user');
  assertEquals(params.subject_id, 'user_123');
  assertEquals(params.order, 'desc');
});

// FGA - query
Deno.test('FGA - query makes query request', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    data: [
      {
        resource_type: 'role',
        resource_id: 'admin',
        warrant: {
          resource_type: 'role',
          resource_id: 'admin',
          relation: 'member',
          subject: {
            resource_type: 'user',
            resource_id: 'user_123',
          },
        },
        is_implicit: false,
      },
    ],
    list_metadata: {
      before: null,
      after: null,
    },
  }));
  
  const { data: queryResults } = await workos.fga.query({
    q: 'select role where user:user_123 is member',
  });
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/query'), true);
  assertEquals(queryResults, [
    {
      resourceType: 'role',
      resourceId: 'admin',
      warrant: {
        resourceType: 'role',
        resourceId: 'admin',
        relation: 'member',
        subject: {
          resourceType: 'user',
          resourceId: 'user_123',
        },
      },
      isImplicit: false,
    },
  ]);
});

Deno.test('FGA - query sends correct params and options', async () => {
  setup();
  
  fetchOnce(JSON.stringify({
    data: [
      {
        resourceType: 'role',
        resourceId: 'admin',
        warrant: {
          resourceType: 'role',
          resourceId: 'admin',
          relation: 'member',
          subject: {
            resourceType: 'user',
            resourceId: 'user_123',
          },
        },
        isImplicit: false,
      },
    ],
    list_metadata: {
      before: null,
      after: null,
    },
  }));
  
  await workos.fga.query(
    {
      q: 'select role where user:user_123 is member',
      order: 'asc',
    },
    {
      warrantToken: 'some_token',
    },
  );
  
  const url = fetchURL();
  assertEquals(typeof url, 'string');
  assertEquals(url?.includes('/fga/v1/query'), true);
  
  const params = fetchSearchParams();
  assertEquals(params.q, 'select role where user:user_123 is member');
  assertEquals(params.order, 'asc');
  
  const headers = fetchHeaders();
  if (headers) {
    assertEquals(headers['Warrant-Token'], 'some_token');
  }
});
