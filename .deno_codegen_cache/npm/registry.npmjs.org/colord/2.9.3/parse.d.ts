import { Format, Input, ParseResult, Parsers } from "./types";
export declare const parsers: Parsers;
/** Tries to convert an incoming value into RGBA color by going through all color model parsers */
export declare const parse: (input: Input) => ParseResult | [null, undefined];
/**
 * Returns a color model name for the input passed to the function.
 */
export declare const getFormat: (input: Input) => Format | undefined;
