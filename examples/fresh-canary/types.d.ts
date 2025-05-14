// Define JSX namespace to solve "JSX element implicitly has type 'any'" error
import { JSX } from "preact";

declare global {
  namespace JSX {
    // Preact's JSX.IntrinsicElements
    interface IntrinsicElements extends JSX.IntrinsicElements {}
  }
}
