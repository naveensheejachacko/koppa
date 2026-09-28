import type { RequestHandler } from "express";

export function callableExport<Args extends unknown[]>(
  mod: unknown,
): (...args: Args) => RequestHandler {
  if (typeof mod === "function") {
    return mod as (...args: Args) => RequestHandler;
  }
  if (
    mod &&
    typeof mod === "object" &&
    "default" in mod &&
    typeof (mod as { default: unknown }).default === "function"
  ) {
    return (mod as { default: (...args: Args) => RequestHandler }).default;
  }
  throw new Error("Expected a callable CommonJS/ESM middleware export");
}
