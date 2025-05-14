import { Something } from "./something";
import type { OtherThing } from "./otherThing";
import { YetAnotherThing } from "../utils/things";

export interface TestInterface {
  field1: any;
  field2: any[];
  callback: (param: any) => any;
}
