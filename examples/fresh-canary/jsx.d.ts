// JSX declaration file for Fresh 2.x + Preact applications
import { JSX as PreactJSX } from "preact";

declare global {
  namespace JSX {
    interface IntrinsicElements extends PreactJSX.IntrinsicElements {}
  }
}
