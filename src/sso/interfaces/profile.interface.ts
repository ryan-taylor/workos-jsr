import type { UnknownRecord } from '../../common/interfaces/unknown-record.interface.ts.ts';
import type { RoleResponse } from '../../roles/interfaces.ts.ts';
import type { ConnectionType } from './connection-type.enum.ts.ts';

export interface Profile<CustomAttributesType extends UnknownRecord> {
  id: string;
  idpId: string;
  organizationId?: string;
  connectionId: string;
  connectionType: ConnectionType;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: RoleResponse;
  groups?: string[];
  customAttributes?: CustomAttributesType;
  rawAttributes?: { [key: string]: any };
}

export interface ProfileResponse<CustomAttributesType extends UnknownRecord> {
  id: string;
  idp_id: string;
  organization_id?: string;
  connection_id: string;
  connection_type: ConnectionType;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: RoleResponse;
  groups?: string[];
  custom_attributes?: CustomAttributesType;
  raw_attributes?: { [key: string]: any };
}
