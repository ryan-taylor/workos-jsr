import type { MetadataMap } from "../../common/interfaces/metadata.interface.ts";

export interface DirectoryGroup {
  id: string;
  idpId: string;
  directoryId: string;
  organizationId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
  rawAttributes: MetadataMap;
}

export interface DirectoryGroupResponse {
  id: string;
  idp_id: string;
  directory_id: string;
  organization_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  raw_attributes: MetadataMap;
}
