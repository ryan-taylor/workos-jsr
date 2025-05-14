// Test file for cached patch _runtime_strict_output version
import { Something } from "./something.ts";
import { OtherThing } from "./otherThing.ts";
import { Thing } from "../utils/things.ts";

// Use imports to verify proper module loading
const something = new Something("cached-runtime-strict-output");
const otherThing: OtherThing = { id: "123", name: "test" };
const thing: Thing = {
  id: "456",
  type: "test",
  attributes: { key: "value" }
};

// Export for testing
export { something, otherThing, thing };
