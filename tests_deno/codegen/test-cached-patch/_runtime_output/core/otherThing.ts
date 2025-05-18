// OtherThing type definition
export type OtherThing = {
  id: string;
  name: string;
  [key: string]: unknown;
};

export function createOtherThing(id: string, name: string): OtherThing {
  return { id, name };
}
