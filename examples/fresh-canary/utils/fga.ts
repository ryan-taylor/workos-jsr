// Utility functions for Fine-Grained Authorization (FGA) with WorkOS

import { WorkOS } from '../../../src/workos.ts';

// Define simplified interfaces for our UI
export interface Resource {
  resourceType: string;
  resourceId: string;
  meta?: Record<string, unknown>;
}

export interface WarrantToken {
  warrantToken: string;
}

export interface CheckResult {
  result: boolean;
}

export interface QueryResult {
  objectType: string;
  objectId: string;
}

// Initialize WorkOS client
export const workos = new WorkOS(Deno.env.get('WORKOS_API_KEY') || '');

// Types for FGA operations
export interface ResourceDefinition {
  resourceType: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
}

export interface RelationshipDefinition {
  resource: ResourceDefinition;
  relation: string;
  subject: ResourceDefinition;
}

// Create a resource in FGA
export async function createResource(resource: ResourceDefinition): Promise<Resource> {
  try {
    return await workos.fga.createResource({
      resource,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error creating FGA resource:', errorMessage);
    throw new Error(`Failed to create resource: ${errorMessage}`);
  }
}

// Update a resource in FGA
export async function updateResource(resource: ResourceDefinition, meta?: Record<string, unknown>): Promise<Resource> {
  try {
    return await workos.fga.updateResource({
      resource,
      meta,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error updating FGA resource:', errorMessage);
    throw new Error(`Failed to update resource: ${errorMessage}`);
  }
}

// Delete a resource in FGA
export async function deleteResource(resource: ResourceDefinition): Promise<void> {
  try {
    await workos.fga.deleteResource(resource);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error deleting FGA resource:', errorMessage);
    throw new Error(`Failed to delete resource: ${errorMessage}`);
  }
}

// List all resources in FGA
export async function listResources(): Promise<Resource[]> {
  try {
    const resources = await workos.fga.listResources();
    return resources.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error listing FGA resources:', errorMessage);
    throw new Error(`Failed to list resources: ${errorMessage}`);
  }
}

// Create a relationship between resources
export async function createRelationship(relationship: RelationshipDefinition): Promise<WarrantToken> {
  try {
    return await workos.fga.writeWarrant({
      resource: relationship.resource,
      relation: relationship.relation,
      subject: relationship.subject,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error creating FGA relationship:', errorMessage);
    throw new Error(`Failed to create relationship: ${errorMessage}`);
  }
}

// Delete a relationship between resources
export async function deleteRelationship(relationship: RelationshipDefinition): Promise<WarrantToken> {
  try {
    return await workos.fga.writeWarrant({
      op: 'delete',
      resource: relationship.resource,
      relation: relationship.relation,
      subject: relationship.subject,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error deleting FGA relationship:', errorMessage);
    throw new Error(`Failed to delete relationship: ${errorMessage}`);
  }
}

// Check if a relationship exists
export async function checkRelationship(relationship: RelationshipDefinition): Promise<CheckResult> {
  try {
    return await workos.fga.check({
      checks: [
        {
          resource: relationship.resource,
          relation: relationship.relation,
          subject: relationship.subject,
        },
      ],
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error checking FGA relationship:', errorMessage);
    throw new Error(`Failed to check relationship: ${errorMessage}`);
  }
}

// Query relationships
export async function queryRelationships(query: string): Promise<QueryResult[]> {
  try {
    const results = await workos.fga.query({
      q: query,
    });
    return results.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error querying FGA relationships:', errorMessage);
    throw new Error(`Failed to query relationships: ${errorMessage}`);
  }
}

// Example authorization models
export const exampleModels = {
  rbac: {
    objectTypes: [
      { name: 'user', description: 'A user in the system' },
      { name: 'role', description: 'A role that can be assigned to users' },
      { name: 'permission', description: 'A permission that can be assigned to roles' },
    ],
    relationships: [
      { source: 'user', relation: 'member', target: 'role', description: 'User is a member of a role' },
      { source: 'role', relation: 'has', target: 'permission', description: 'Role has a permission' },
    ],
  },
  documentAccess: {
    objectTypes: [
      { name: 'user', description: 'A user in the system' },
      { name: 'document', description: 'A document in the system' },
      { name: 'folder', description: 'A folder containing documents' },
    ],
    relationships: [
      { source: 'user', relation: 'owner', target: 'document', description: 'User owns a document' },
      { source: 'user', relation: 'viewer', target: 'document', description: 'User can view a document' },
      { source: 'user', relation: 'editor', target: 'document', description: 'User can edit a document' },
      { source: 'folder', relation: 'contains', target: 'document', description: 'Folder contains a document' },
      { source: 'user', relation: 'owner', target: 'folder', description: 'User owns a folder' },
    ],
  },
  tenantAccess: {
    objectTypes: [
      { name: 'user', description: 'A user in the system' },
      { name: 'tenant', description: 'A tenant (organization)' },
    ],
    relationships: [
      { source: 'user', relation: 'member', target: 'tenant', description: 'User is a member of a tenant' },
      { source: 'user', relation: 'admin', target: 'tenant', description: 'User is an admin of a tenant' },
    ],
  },
};
