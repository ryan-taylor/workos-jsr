import { PaginationOptions } from '../../common/interfaces/pagination-options.interface.ts';
import { ConnectionType } from './connection-type.enum.ts';

export interface ListConnectionsOptions extends PaginationOptions {
  connectionType?: ConnectionType;
  domain?: string;
  organizationId?: string;
}

export interface SerializedListConnectionsOptions extends PaginationOptions {
  connection_type?: ConnectionType;
  domain?: string;
  organization_id?: string;
}
