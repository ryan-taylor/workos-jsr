/**
 * Compatibility interface for legacy FGA tests
 * @deprecated Use the new CheckOptions interface instead
 */
export enum CheckOp {
  AnyOf = "anyOf",
  AllOf = "allOf"
}

/**
 * Legacy warrant operation enum for backwards compatibility
 * @deprecated
 */
export enum WarrantOp {
  AND = "and",
  OR = "or",
  NOT = "not",
  Delete = "delete"
}