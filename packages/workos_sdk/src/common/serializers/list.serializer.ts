import type { List, ListResponse } from "../interfaces.ts";

export const deserializeList = <TSerialized, TDeserialized>(
  list: ListResponse<TSerialized>,
  deserializer: (serialized: TSerialized) => TDeserialized,
): List<TDeserialized> => ({
  data: list.data.map(deserializer),
  listMetadata: list.listMetadata,
});
