// Import standard Deno assertions
import { assertEquals, assertInstanceOf } from 'https://deno.land/std/assert/mod.ts';

import { resetMockFetch } from '../common/utils/test-utils.ts';
import { BadRequestException } from '../common/exceptions/bad-request.exception.ts';
import { WorkOS } from '../workos.ts';

// Define common test data
const event = {
  action: 'document.updated',
  occurredAt: new Date(),
  actor: {
    id: 'user_1',
    name: 'Jon Smith',
    type: 'user',
  },
  targets: [
    {
      id: 'document_39127',
      type: 'document',
    },
  ],
  context: {
    location: '192.0.0.8',
    userAgent: 'Firefox',
  },
  metadata: {
    successful: true,
  },
};

// Define a simple schema for testing
const schema = {
  action: 'user.logged_in',
  actor: {
    metadata: {
      actor_id: 'string',
    },
  },
  targets: [
    {
      type: 'user',
      metadata: {
        user_id: 'string',
      },
    },
  ],
  metadata: {
    foo: 'number',
    baz: 'boolean',
  },
};

const schemaWithoutMetadata = { ...schema, metadata: undefined };

// Helper function for test setup
function setupTest() {
  resetMockFetch();
  return new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
}

Deno.test('AuditLogs - createEvent sends the correct data to the API', async () => {
  // Create a WorkOS instance
  const workos = setupTest();
  
  // Mock the post method to return a successful response
  const originalPost = workos.post;
  let postCalled = false;
  let postPath = '';
  let postData: any = null;
  let postOptions: any = null;
  
  // Use type assertion to bypass TypeScript's type checking for the mock
  workos.post = ((path: string, data: any, options = {}) => {
    postCalled = true;
    postPath = path;
    postData = data;
    postOptions = options;
    return Promise.resolve({ data: { success: true } });
  }) as typeof workos.post;
  
  try {
    // Call the method being tested
    await workos.auditLogs.createEvent('org_123', event, {
      idempotencyKey: 'the-idempotency-key',
    });
    
    // Verify the post method was called with the correct arguments
    assertEquals(postCalled, true);
    assertEquals(postPath, '/audit_logs/events');
    assertEquals(postData.organization_id, 'org_123');
    assertEquals(postOptions.idempotencyKey, 'the-idempotency-key');
  } finally {
    // Restore the original method
    workos.post = originalPost;
  }
});

Deno.test('AuditLogs - createEvent handles API errors correctly', async () => {
  // Create a WorkOS instance
  const workos = setupTest();
  
  // Mock the post method to throw an error
  const originalPost = workos.post;
  
  // Use type assertion to bypass TypeScript's type checking for the mock
  workos.post = (() => {
    throw new BadRequestException({
      code: '400',
      errors: [
        {
          field: 'occurred_at',
          code: 'occurred_at must be an ISO 8601 date string',
        },
      ],
      message: 'Audit Log could not be processed due to missing or incorrect data.',
      requestID: 'a-request-id',
    });
  }) as typeof workos.post;
  
  try {
    // Call the method and expect it to throw
    let error;
    try {
      await workos.auditLogs.createEvent('org_123', event);
    } catch (e) {
      error = e;
    }
    
    // Verify the error
    assertInstanceOf(error, BadRequestException);
  } finally {
    // Restore the original method
    workos.post = originalPost;
  }
});

Deno.test('AuditLogs - createExport sends the correct data to the API', async () => {
  // Create a WorkOS instance
  const workos = setupTest();
  
  // Mock the post method to return a successful response
  const originalPost = workos.post;
  let postCalled = false;
  let postPath = '';
  let postData: any = null;
  
  const timestamp = new Date().toISOString();
  const mockResponse = {
    object: 'audit_log_export',
    id: 'audit_log_export_1234',
    state: 'pending',
    url: undefined,
    created_at: timestamp,
    updated_at: timestamp,
  };
  
  // Use type assertion to bypass TypeScript's type checking for the mock
  workos.post = ((path: string, data: any) => {
    postCalled = true;
    postPath = path;
    postData = data;
    return Promise.resolve({ data: mockResponse });
  }) as typeof workos.post;
  
  const options = {
    organizationId: 'org_123',
    rangeStart: new Date(),
    rangeEnd: new Date(),
  };
  
  try {
    // Call the method being tested
    const result = await workos.auditLogs.createExport(options);
    
    // Verify the post method was called with the correct arguments
    assertEquals(postCalled, true);
    assertEquals(postPath, '/audit_logs/exports');
    assertEquals(postData.organization_id, options.organizationId);
    
    // Verify the result
    assertEquals(result.object, 'audit_log_export');
    assertEquals(result.id, 'audit_log_export_1234');
    assertEquals(result.state, 'pending');
  } finally {
    // Restore the original method
    workos.post = originalPost;
  }
});

Deno.test('AuditLogs - getExport sends the correct data to the API', async () => {
  // Create a WorkOS instance
  const workos = setupTest();
  
  // Mock the get method to return a successful response
  const originalGet = workos.get;
  let getCalled = false;
  let getPath = '';
  
  const timestamp = new Date().toISOString();
  const mockResponse = {
    object: 'audit_log_export',
    id: 'audit_log_export_1234',
    state: 'pending',
    url: undefined,
    created_at: timestamp,
    updated_at: timestamp,
  };
  
  // Use type assertion to bypass TypeScript's type checking for the mock
  workos.get = ((path: string) => {
    getCalled = true;
    getPath = path;
    return Promise.resolve({ data: mockResponse });
  }) as typeof workos.get;
  
  try {
    // Call the method being tested
    const result = await workos.auditLogs.getExport('audit_log_export_1234');
    
    // Verify the get method was called with the correct arguments
    assertEquals(getCalled, true);
    assertEquals(getPath, '/audit_logs/exports/audit_log_export_1234');
    
    // Verify the result
    assertEquals(result.object, 'audit_log_export');
    assertEquals(result.id, 'audit_log_export_1234');
    assertEquals(result.state, 'pending');
  } finally {
    // Restore the original method
    workos.get = originalGet;
  }
});

Deno.test('AuditLogs - createSchema sends the correct data to the API', async () => {
  // Create a WorkOS instance
  const workos = setupTest();
  
  // Mock the post method to return a successful response
  const originalPost = workos.post;
  let postCalled = false;
  let postPath = '';
  let postOptions: any = null;
  
  const time = new Date().toISOString();
  const mockResponse = {
    object: 'audit_log_schema',
    version: 1,
    targets: [
      {
        type: 'user',
        metadata: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
            },
          },
        },
      },
    ],
    actor: {
      metadata: {
        type: 'object',
        properties: {
          actor_id: {
            type: 'string',
          },
        },
      },
    },
    metadata: {
      type: 'object',
      properties: {
        foo: {
          type: 'number',
        },
        baz: {
          type: 'boolean',
        },
      },
    },
    created_at: time,
  };
  
  // Use type assertion to bypass TypeScript's type checking for the mock
  workos.post = ((path: string, _data: any, options = {}) => {
    postCalled = true;
    postPath = path;
    postOptions = options;
    return Promise.resolve({ data: mockResponse });
  }) as typeof workos.post;
  
  try {
    // Call the method being tested
    const result = await workos.auditLogs.createSchema(schema, {
      idempotencyKey: 'the-idempotency-key',
    });
    
    // Verify the post method was called with the correct arguments
    assertEquals(postCalled, true);
    assertEquals(postPath, '/audit_logs/actions/user.logged_in/schemas');
    assertEquals(postOptions.idempotencyKey, 'the-idempotency-key');
    
    // Verify the result
    assertEquals(result.object, 'audit_log_schema');
    assertEquals(result.version, 1);
  } finally {
    // Restore the original method
    workos.post = originalPost;
  }
});

Deno.test('AuditLogs - createSchema handles requests without metadata', async () => {
  // Create a WorkOS instance
  const workos = setupTest();
  
  // Mock the post method to return a successful response
  const originalPost = workos.post;
  let postCalled = false;
  let postPath = '';
  let postData: any = null;
  
  const time = new Date().toISOString();
  const mockResponse = {
    object: 'audit_log_schema',
    version: 1,
    targets: [
      {
        type: 'user',
        metadata: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
            },
          },
        },
      },
    ],
    actor: {
      metadata: {
        type: 'object',
        properties: {
          actor_id: {
            type: 'string',
          },
        },
      },
    },
    created_at: time,
  };
  
  // Use type assertion to bypass TypeScript's type checking for the mock
  workos.post = ((path: string, data: any) => {
    postCalled = true;
    postPath = path;
    postData = data;
    return Promise.resolve({ data: mockResponse });
  }) as typeof workos.post;
  
  try {
    // Call the method being tested
    const result = await workos.auditLogs.createSchema(schemaWithoutMetadata);
    
    // Verify the post method was called with the correct arguments
    assertEquals(postCalled, true);
    assertEquals(postPath, '/audit_logs/actions/user.logged_in/schemas');
    assertEquals(postData.metadata, undefined);
    
    // Verify the result
    assertEquals(result.object, 'audit_log_schema');
    assertEquals(result.version, 1);
    assertEquals(result.metadata, undefined);
  } finally {
    // Restore the original method
    workos.post = originalPost;
  }
});
