import type { KeyContext } from "../key.interface.ts";
import type { ObjectUpdateBy } from "../object.interface.ts";

export interface ReadObjectOptions {
  id: string;
}

export interface ReadObjectMetadataResponse {
  context: KeyContext;
  environment_id: string;
  id: string;
  key_id: string;
  updated_at: string;
  updated_by: ObjectUpdateBy;
  version_id: string;
}

export interface ReadObjectResponse {
  id: string;
  metadata: ReadObjectMetadataResponse;
  name: string;
  value: string;
}
