/**
 * Fresh compatibility layer for middleware
 * This file provides a wrapMw function that works with both Fresh 1.x and 2.x
 */

import { freshMajor } from '../../../../scripts/select_fresh.ts';

export type MW_v1 = (req: Request, ctx: any) => Promise<Response>;
export type MW_v2 = (ctx: any) => Promise<Response>;

/**
 * Wraps a middleware function to work with both Fresh 1.x and 2.x
 * @param fn The middleware function to wrap
 * @returns A middleware function compatible with the current Fresh version
 */
export function wrapMw(fn: MW_v1): MW_v1 | MW_v2 {
  return freshMajor() === 1 ? fn : (ctx: any) => fn(ctx.req, ctx);
}
