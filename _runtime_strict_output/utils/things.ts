// Utility functions and types
export interface Thing {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

export function createThing(id: string, type: string): Thing {
  return {
    id,
    type,
    attributes: {},
  };
}

export function addAttribute(thing: Thing, key: string, value: unknown): Thing {
  return {
    ...thing,
    attributes: {
      ...thing.attributes,
      [key]: value,
    },
  };
}
