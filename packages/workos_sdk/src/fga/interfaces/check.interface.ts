import type { Subject } from "./warrant.interface.ts";
import type { ResourceOptions, ResourceInterface } from "./resource.interface.ts";

export interface CheckItem {
  resource: ResourceInterface | ResourceOptions;
  relation: string;
  subject: ResourceInterface | Subject;
  context?: { [key: string]: any };
}

export interface SerializedCheckItem {
  resource_type: string;
  resource_id: string;
  relation: string;
  subject: {
    resource_type: string;
    resource_id: string;
    relation?: string;
  };
  context?: { [key: string]: any };
}

export interface CheckOptions {
  checks: CheckItem[];
}

export interface SerializedCheckOptions {
  checks: SerializedCheckItem[];
}

export interface CheckBatchOptions {
  checks: CheckItem[];
}

export interface SerializedCheckBatchOptions {
  checks: SerializedCheckItem[];
}

export interface CheckRequestOptions {
  warrantToken?: string;
}

export interface CheckResultResponse {
  result: string;
  is_implicit: boolean;
  warrant_token: string;
}

export class CheckResult {
  result: string;
  isImplicit: boolean;
  warrantToken: string;

  constructor(response: CheckResultResponse) {
    this.result = response.result;
    this.isImplicit = response.is_implicit;
    this.warrantToken = response.warrant_token;
  }

  /**
   * Returns whether the check was authorized
   * @returns true if authorized, false otherwise
   */
  isAuthorized(): boolean {
    return this.result === "true";
  }
}