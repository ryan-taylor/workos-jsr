/**
 * Interface representing an Audit Log Schema
 */
export interface AuditLogSchema {
  /** The object type */
  object: string;

  /** Version number of the schema */
  version: number;

  /** Schema definition for targets */
  targets?: Array<{
    /** Type of the target */
    type: string;

    /** Metadata schema */
    metadata?: {
      type: string;
      properties: Record<string, { type: string }>;
    };
  }>;

  /** Schema definition for actor */
  actor?: {
    /** Metadata schema */
    metadata?: {
      type: string;
      properties: Record<string, { type: string }>;
    };
  };

  /** Metadata schema */
  metadata?: {
    type: string;
    properties: Record<string, { type: string }>;
  };

  /** When the schema was created */
  created_at: string;
}
