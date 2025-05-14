#!/usr/bin/env -S deno run -A

import { ensureDir, exists } from "jsr:@std/fs@^1";
import { dirname } from "jsr:@std/path@^1";

/**
 * Cache for compiled Mustache templates
 * Uses the template string as the key
 */
const templateCache = new Map<string, unknown>();

/**
 * Performance baselines for template rendering
 */
interface TemplatePerformance {
  templates: Record<string, number>;
  lastUpdated: string;
}

/**
 * Path to the performance cache file
 */
const PERF_CACHE_PATH = ".cache/codegen_perf.json";

/**
 * Loads the performance baselines from the cache file
 * Creates a new cache file if it doesn't exist
 */
async function loadPerformanceBaselines(): Promise<TemplatePerformance> {
  // Check if the cache directory exists, create if not
  await ensureDir(dirname(PERF_CACHE_PATH));

  if (await exists(PERF_CACHE_PATH)) {
    try {
      const content = await Deno.readTextFile(PERF_CACHE_PATH);
      return JSON.parse(content);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`Failed to read performance cache: ${message}`);
    }
  }

  // Return empty baselines if file doesn't exist or is invalid
  return {
    templates: {},
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save performance baselines to the cache file
 */
async function savePerformanceBaselines(
  baselines: TemplatePerformance,
): Promise<void> {
  await ensureDir(dirname(PERF_CACHE_PATH));

  try {
    await Deno.writeTextFile(
      PERF_CACHE_PATH,
      JSON.stringify(baselines, null, 2),
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn(`Failed to save performance cache: ${message}`);
  }
}

/**
 * Report template render time and compare against baseline
 */
async function reportRenderTime(
  template: string,
  renderTime: number,
): Promise<void> {
  const templateKey = template.length > 50
    ? `${template.substring(0, 47)}...`
    : template;

  // Load existing performance baselines
  const baselines = await loadPerformanceBaselines();

  // Check if we have a baseline for this template
  if (templateKey in baselines.templates) {
    const baseline = baselines.templates[templateKey];

    // Compare against baseline with 2x threshold
    if (renderTime > baseline * 2) {
      const message = `Template rendering exceeds 2x baseline: ${
        renderTime.toFixed(2)
      }ms vs ${baseline.toFixed(2)}ms baseline`;

      // Output GitHub Actions notice for CI integration
      if (Deno.env.get("GITHUB_ACTIONS") === "true") {
        console.log(`::notice::${message}`);
      } else {
        console.warn(message);
      }
    }
  } else {
    // Store the first render time as the baseline
    baselines.templates[templateKey] = renderTime;
    baselines.lastUpdated = new Date().toISOString();
    await savePerformanceBaselines(baselines);
  }
}

/**
 * Get or create a cached template
 * This function is used by the enhanced render function
 */
function getCachedTemplate(
  template: string,
  parseFunction: (template: string) => unknown,
): unknown {
  if (!templateCache.has(template)) {
    templateCache.set(template, parseFunction(template));
  }
  return templateCache.get(template);
}

/**
 * Creates a cached render function that wraps the original render function
 */
function createCachedRenderFunction(
  originalRender: (
    template: string,
    view: unknown,
    partials?: Record<string, string>,
  ) => string,
  parseFunction: (template: string) => unknown,
): (
  template: string,
  view: unknown,
  partials?: Record<string, string>,
) => string {
  return function cachedRender(
    template: string,
    view: unknown,
    partials?: Record<string, string>,
  ): string {
    // Check if performance measurement should be bypassed
    const bypassPerf = Deno.env.get("CODEGEN_PERF_IGNORE") === "true";

    // Start timing
    const startTime = performance.now();

    // Ensure template is cached
    getCachedTemplate(template, parseFunction);

    // Call the original render function
    const result = originalRender(template, view, partials);

    // Finish timing
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Skip performance reporting if bypassed
    if (!bypassPerf) {
      // Report render time asynchronously to not block rendering
      reportRenderTime(template, renderTime).catch((err) => {
        console.error(
          `Failed to report render time: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });
    }

    return result;
  };
}

/**
 * Enhance any Mustache-like object with caching capabilities
 * This approach doesn't rely on importing Mustache directly
 * @param mustacheObj An object with render and parse methods like Mustache
 */
export function enhanceMustacheWithCaching(
  mustacheObj: {
    render: (
      template: string,
      view: unknown,
      partials?: Record<string, string>,
    ) => string;
    parse: (template: string) => unknown;
  },
): void {
  // Store original render method
  const originalRender = mustacheObj.render;

  // Replace with enhanced cached version
  mustacheObj.render = createCachedRenderFunction(
    originalRender,
    mustacheObj.parse,
  );

  console.log("Mustache template caching enabled");
}

/**
 * Clear the template cache
 * Useful for testing or if templates change at runtime
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

/**
 * Get the size of the template cache
 * Useful for debugging or monitoring
 */
export function getTemplateCacheSize(): number {
  return templateCache.size;
}

/**
 * A monkey-patching function to be called when openapi-typescript-codegen is used
 * This should be called at the appropriate point in build.ts before code generation
 */
export async function setupMustacheCaching(): Promise<void> {
  // We'll use an approach that works without direct import
  // This function will be called right before code generation
  try {
    console.log("Setting up Mustache template caching...");

    // Create .cache directory to ensure it exists
    await ensureDir(dirname(PERF_CACHE_PATH));

    console.log("Mustache cache infrastructure prepared.");
    console.log(
      "Call enhanceMustacheWithCaching() when Mustache instance is available",
    );
  } catch (error) {
    console.error(
      "Failed to setup Mustache caching:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
