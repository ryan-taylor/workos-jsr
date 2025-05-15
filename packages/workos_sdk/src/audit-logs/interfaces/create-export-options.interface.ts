/**
 * Interface for options when creating an audit log export
 */
export interface CreateExportOptions {
  /** The ID of the organization */
  organizationId: string;

  /** The start timestamp for the export range */
  rangeStart: Date | string;

  /** The end timestamp for the export range */
  rangeEnd: Date | string;

  /** Optional filtering by actions */
  actions?: string[];

  /** Optional filtering by actor IDs */
  actorIds?: string[];

  /** Optional filtering by actor names */
  actorNames?: string[];

  /** Optional filtering by target IDs */
  targetIds?: string[];

  /** Optional filtering by target names */
  targetNames?: string[];
}
