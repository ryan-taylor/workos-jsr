// Exported utility functions and types
export interface YetAnotherThing {
  id: string;
  name: string;
  value: number;
}

export function doSomething(): YetAnotherThing {
  return {
    id: "123",
    name: "Example",
    value: 42,
  };
}
