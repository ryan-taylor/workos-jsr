import type { GetOptions } from "workos/common/interfaces.ts";
import type {
  ResourceInterface,
  ResourceOptions,
} from "workos/fga/interfaces/resource.interface.ts";
import type { WarrantOp } from "workos/fga/interfaces/warrant-op.enum.ts";

export interface ListWarrantsOptions {
  resourceType?: string;
  resourceId?: string;
  relation?: string;
  subjectType?: string;
  subjectId?: string;
  subjectRelation?: string;
  limit?: number;
  after?: string | null;
}

export interface SerializedListWarrantsOptions {
  resource_type?: string;
  resource_id?: string;
  relation?: string;
  subject_type?: string;
  subject_id?: string;
  subject_relation?: string;
  limit?: number;
  after?: string | null;
}

export interface PolicyContext {
  [key: string]: any;
}

export interface Subject {
  resourceType: string;
  resourceId: string;
  relation?: string;
}

export interface SerializedSubject {
  resource_type: string;
  resource_id: string;
  relation?: string;
}

export interface Warrant {
  resourceType: string;
  resourceId: string;
  relation: string;
  subject: Subject;
  policy?: string;
}

export interface WriteWarrantOptions {
  op?: WarrantOp;
  resource: ResourceInterface | ResourceOptions;
  relation: string;
  subject: ResourceInterface | Subject;
  policy?: string;
}

export interface SerializedWriteWarrantOptions {
  op?: WarrantOp;
  resource_type: string;
  resource_id: string;
  relation: string;
  subject: SerializedSubject;
  policy?: string;
}

// Define our own type since the constraint doesn't match
export interface ListWarrantsRequestOptions {
  warrantToken?: string;
}

export interface WarrantResponse {
  resource_type: string;
  resource_id: string;
  relation: string;
  subject: SerializedSubject;
  policy?: string;
}

export interface WarrantToken {
  warrantToken: string;
}

export interface WarrantTokenResponse {
  warrant_token: string;
}