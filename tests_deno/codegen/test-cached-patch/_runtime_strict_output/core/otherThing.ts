// OtherThing type definition
export type OtherThing = {
  id: string;
  name: string;
  data?: unknown;
};

export function createOtherThing(id: string, name: string): OtherThing {
  return { id, name };
}
