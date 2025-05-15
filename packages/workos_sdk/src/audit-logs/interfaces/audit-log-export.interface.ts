/**
 * Interface representing an Audit Log Export
 */
export interface AuditLogExport {
  /** The object type */
  object: string;

  /** Unique identifier for the export */
  id: string;

  /** The current state of the export */
  state: string;

  /** URL to download the export (once completed) */
  url?: string;

  /** When the export was created */
  created_at: string;

  /** When the export was last updated */
  updated_at: string;
}
