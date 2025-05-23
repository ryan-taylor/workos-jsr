Fresh 2.x on Deno 2.x – Technical Brief (May 2025)

Introduction

Fresh 2.x is the upcoming major version of Deno’s web framework (Fresh) designed
to align with Deno 2.x. As of May 2025, Fresh 2.x is in an alpha stage, but many
of its features are already usable for experimentation ￼. This brief provides a
comprehensive overview of Fresh 2.x’s current capabilities and architectural
direction, and how to implement Fresh 2.x projects on Deno 2.x while remaining
compatible with Deno 1.x. We also outline best practices for building
Software-as-a-Service (SaaS) platforms that leverage Deno 2.x and Fresh 2.x to
minimize external dependencies, and provide guidelines for porting Node.js
dependencies (like the WorkOS SDK) natively to Deno 2.x.

Fresh 2.x Capabilities and Architectural Direction

Fresh 2.x introduces significant architectural simplifications and new
capabilities compared to Fresh 1.x. According to the Fresh 2.0 roadmap, the
framework is being made “massively simpler” and will be distributed via Deno’s
new JavaScript Registry (JSR) in the 2.0 release ￼. In practice, this means
Fresh’s core packages are published on the Deno registry (JSR) for
straightforward installation (e.g. deno add @fresh/core) ￼. Key changes and
features in Fresh 2.x include: •	JSR-based Distribution & NPM Integration: Fresh
2.x packages (e.g. @fresh/core) are available on Deno’s JSR, moving away from
URL imports on deno.land/x. In tandem, third-party dependencies like Preact and
esbuild that Fresh relies on are now imported via the npm: specifier (using the
npm registry) instead of CDNs like esm.sh ￼. This improves reliability and
allows use of Deno’s lockfile for reproducible builds ￼. It also opens the door
to better Node.js compatibility, since Fresh’s dependencies can be resolved in
Node environments as well ￼. •	Express/Hono-like Imperative API: Fresh 2.x adds
a new imperative routing and middleware API reminiscent of Express or Hono.
Instead of purely file-system based routing configuration, developers can create
an App instance, attach middleware, and programmatically define routes. This
provides more flexibility for plugins and dynamic route setup ￼ ￼. For example,
an entry file can create the app, set global middleware (like trailing slash
handling), and then use a helper to load routes from the filesystem:

import { App, fsRoutes, trailingSlashes } from "@fresh/core";

const app = new App({ root: import.meta.url }) .use(trailingSlashes("never"));
// middleware

await fsRoutes(app, { // load routes and islands dynamically loadIsland: (path)
=> import(`./islands/${path}`), loadRoute: (path) => import(`./routes/${path}`),
});

export { app };

Listing: Fresh 2.x imperative app initialization and route loading ￼ ￼. This
approach eliminates the need for generated routing files and allows fine-grained
control via code. It makes Fresh’s internal routing more pluggable and easier to
customize.

    •	“True” Async Components: Fresh 2.x aims to support truly asynchronous components, enhancing server-side rendering (SSR) flexibility ￼. In Fresh 1.x, page components and route handlers could fetch data asynchronously via separate handler functions (or by using ctx.render with awaited data) ￼ ￼. Fresh 2.x extends this by likely allowing components themselves to be defined as async functions or to await asynchronous operations directly during rendering. This means components can perform data fetching or other async setup within the render flow, simplifying data-loading logic. This capability aligns Fresh with modern SSR frameworks that natively support awaiting data inside components. (For example, React’s upcoming server components and frameworks like Next.js 13+ use async component paradigms.) While the exact API in Fresh 2.x is still being finalized, the core idea is to make data fetching in components more ergonomic and fully integrated.
    •	createDefine() Utility for Handlers and Pages: To improve developer experience, Fresh 2.x introduces a createDefine() API that streamlines the definition of route handlers and page components with proper types. This utility helps define request context state and tie together the handler and component. For instance, one can create a typed define object and use it to declare a GET handler and the corresponding page component, sharing state between them ￼ ￼. An example:

import { createDefine, page } from "fresh";

interface State { title: string }\
const define = createDefine<State>();

export const handler = define.handlers({ async GET(ctx) { const post = await
readPost(ctx.params.id); ctx.title = post.title; return page({ content:
post.content }); }, });

export default define.page<typeof handler>(function PostPage(props) { return

<article>{props.data.content}</article>; });

Listing: Using createDefine() to declare a route handler and page with shared
state. Here, the define object ensures the context State (with a title field) is
consistently typed across the handler and the page’s props. The page() helper
wraps the page data for rendering. This approach reduces boilerplate and
potential mistakes when wiring up handlers to pages.

    •	No Configuration Files (Convention over Configuration): Fresh 2.x removes the need for certain config files that existed in v1. Notably, the fresh.gen.ts (the route manifest) and fresh.config.ts files are eliminated ￼. In Fresh 1.x, fresh.gen.ts was a generated file mapping routes and islands for the runtime, and fresh.config.ts allowed some custom settings. In 2.x, these are gone in favor of the new App API and automatic conventions. This simplifies project structure and reduces the “magic” code generation – making the framework behavior more transparent.
    •	Build Process and JSX Pre-Compilation: One philosophical change in Fresh 2.x is embracing a build step for production deployments. Fresh v1 touted “no build required” (just-in-time compilation at runtime), but this is shifting. The Fresh team has made ahead-of-time prebuilding a requirement for production usage ￼. In fact, references to “no build” have been removed from Fresh’s documentation ￼. Practically, this means you will run a build command (which bundles the project using esbuild) before deploying, to optimize performance. Related to this, Fresh 2’s project initialization enables precompiled JSX transforms, so that JSX/TSX is compiled ahead of time rather than on each request ￼. This yields faster response times in production at the cost of a build step. During development, Fresh will still offer a dev server for live reload, but production code will be precompiled.
    •	Improved Third-Party Integration: Fresh 2.x makes it easier to use npm packages and other third-party libraries. For example, Fresh now ensures process.env.NODE_ENV is defined during build/SSR, which many Node libraries expect ￼. This small change improves compatibility with tools like bundlers and utility libraries that check the environment. Also, Fresh 2.x removed the built-in Twind (Tailwind-in-JS) integration that Fresh 1 provided ￼. Instead, developers can use the official Tailwind CSS plugin or other CSS solutions as needed. Removing Twind reduces framework bloat and external dependency (Twind was a third-party library) while still allowing styling via first-class methods (Tailwind CSS integration remains available ￼).
    •	Observability and Instrumentation: With Deno 2.x adopting new standards (for example, Deno 2.1 introduced experimental OpenTelemetry support in the runtime), Fresh 2.x is beginning to include instrumentation hooks. There are efforts to integrate OpenTelemetry in Fresh’s request handling, leveraging Deno’s native OTEL APIs ￼. This means a Fresh 2 application could emit tracing events for requests and other metrics without pulling in heavy third-party monitoring libraries, taking advantage of Deno’s built-in capabilities. While this support may still be experimental, it signals Fresh’s architectural direction of embracing Deno’s platform features to offer enterprise-grade observability out of the box.

Overall, Fresh 2.x’s design direction is to align closely with Deno 2.x’s
ecosystem improvements and to simplify the developer experience. By using Deno’s
module registry, offering a flexible programmatic API, supporting async
workflows, and relying on standard web APIs and Deno’s built-ins, Fresh 2.x
enables building modern web apps with less boilerplate and less need for
additional frameworks. It remains an islands-based SSR framework (using Preact
under the hood for interactive islands), but now with more ergonomic APIs and
better integration into the broader Deno platform.

Implementing Fresh 2.x on Deno 2.x (with Deno 1.x Compatibility)

Setting up a Fresh 2.x project on Deno 2.x largely follows Fresh’s new
conventions. Since Fresh 2.x is distributed on JSR, you can import its modules
by name. For example, instead of importing from https://deno.land/x/fresh/...,
you use imports like import { App } from "@fresh/core" (after adding the package
via deno add). The project structure in Fresh 2.x remains similar to Fresh 1
(with a routes/ directory for page routes and an islands/ directory for
interactive components), but without the need for a config or generated manifest
file.

A minimal Fresh 2.x application might consist of: an entry point (e.g. main.ts)
where you create and export the app as shown above, a set of React/Preact
components under routes/ (for each page or API endpoint) and islands/ (for
client-interactive components), and a deno.json config file for Deno (including
any permissions or imports mappings if needed). Fresh 2.x uses ESM and JSX
natively – Deno 2.x will handle TypeScript and JSX out-of-the-box, especially
with the framework’s prebuild steps configured.

Using Fresh 2.x on Deno 2.x is straightforward, as Deno 2 is the target runtime
for this framework version. However, many developers may want to try Fresh 2.x
before fully switching to Deno 2, or maintain apps that still run on Deno 1.x.
The good news is that Fresh 2.x can be used with Deno 1.x (for now), with a few
considerations for compatibility: •	Enabling Future Features on Deno 1.x: Deno
2.0 introduces some breaking changes and new behaviors. Deno 1.(latest) included
an environment variable DENO_FUTURE=1 which can be set to enable upcoming Deno
2.0 changes in a Deno 1 runtime ￼. This allows testing Deno 2-oriented code
(like Fresh 2) on Deno 1. For example, the new deno.json imports field for JSR
packages or changes in module resolution might require DENO_FUTURE in Deno 1.
When developing a Fresh 2 app on Deno 1.x, run your scripts with DENO_FUTURE=1
deno task dev (or similar) to ensure Deno 1 behaves as Deno 2 would in relevant
aspects. This helps smooth over differences during the transition period.
•	Fresh’s Compatibility Layer: The Fresh team has included a v1 compatibility
layer in Fresh 2.x to assist with gradual migration. Under the module
@fresh/core/compat, there are shims that emulate Fresh 1.x APIs ￼. This means if
you have an existing Fresh 1 project, you could import from @fresh/core/compat
to keep using certain patterns while internally running on Fresh 2. For
instance, Fresh 1’s start() function or other utilities might be re-exported
there for continuity. Using this compatibility layer, a Fresh 1 project can be
incrementally upgraded: you can switch imports to Fresh 2, run on Deno 1.x with
DENO_FUTURE (or on Deno 2), and still have the application work as expected.
This is intended for alpha/beta testing; ultimately you’d refactor to the new
2.x APIs, but it ensures backward compatibility during the transition.
•	Maintaining Deno 1 Support: Deno 2 is designed to be largely backward
compatible, but it does remove some deprecated APIs. When implementing a Fresh
2.x project, avoid using any APIs that were deprecated in Deno 1.x, as they may
be gone in 2.x ￼. For example, if any Deno global APIs changed or if file system
module paths changed (like shifting to std v1 on JSR), be mindful to use the
updated forms. Most common operations (file I/O, networking, etc.) remain the
same between Deno 1 and 2, so your Fresh 2 code (being mainly high-level web
code) shouldn’t be affected much. Still, test your Fresh 2 project on the latest
Deno 1.x (with DENO_FUTURE) and on Deno 2.x to catch any discrepancies. The
Fresh 2 migration guide ￼ is a valuable resource – it outlines all breaking
changes and how to update your codebase. •	Project Configuration: In Deno 2 (and
1.30+ with future flag), you can use a deno.json configuration file to specify
entries, import maps, tasks, etc., instead of a custom Fresh config. Fresh 2 no
longer needs a special config file; you configure the project via code (the App
builder) and Deno’s own config. To maintain compatibility, use import maps to
alias any Node modules if needed (for example, map npm: specifiers if required,
although Deno handles most automatically), and list the necessary permissions in
deno.json so both Deno 1 and 2 know what to allow. This approach works
consistently across versions.

In summary, implementing Fresh 2.x on Deno 2.x is mostly a matter of adopting
the new Fresh APIs and project structure. To keep Deno 1.x compatibility, use
the provided compat layer and ensure your Deno configuration enables future
features. Many early adopters have reported success running Fresh 2 alpha on
Deno 1.x, which demonstrates that backward compatibility is achievable with
these steps. By designing your project with the new conventions (and avoiding
anything exclusively Deno 2), you can develop on the cutting edge without
stranding users (or team members) still on Deno 1.

SaaS Development Best Practices with Deno 2.x and Fresh 2.x (Maximizing
Features, Minimizing Dependencies)

Building a SaaS platform on Deno 2.x with Fresh 2.x offers an opportunity to
streamline your tech stack. Deno’s philosophy is to provide a batteries-included
environment (from TypeScript support to built-in utilities), and Fresh builds on
that to deliver full-stack web features out of the box. Here are best practices
to leverage Fresh 2.x/Deno 2.x capabilities for SaaS while reducing third-party
dependencies: •	Prefer Built-in Web APIs and Deno Standard Library: Deno uses
standard Web Platform APIs whenever possible, which can replace many
Node.js-specific libraries ￼. For instance, use the global fetch API for HTTP
requests instead of bringing in Axios or node-fetch – Deno’s fetch is
standards-compliant and works like in the browser, making HTTP calls easy.
Similarly, use WebSocket for real-time communications, crypto.subtle or
globalThis.crypto for cryptography, and built-in URL/URLPattern for URL parsing.
Deno’s standard library (deno_std) provides reliable implementations for
utilities like file system path manipulation (std/path), YAML/TOML parsing,
assertions and testing tools, etc., which can remove the need for packages like
Lodash, Moment, or filesystem libraries. By sticking to these first-party APIs,
your SaaS app will be lighter and more secure (since you’re using audited,
maintained code from Deno itself). •	Use Fresh 2.x Framework Features Instead of
External Frameworks: Fresh is a full-stack framework combining server-rendered
pages, a routing layer, and front-end islands for interactivity. This means that
in a SaaS scenario you likely do not need to pull in a separate server framework
(like Express/Koa) or a separate front-end framework (like create-react-app).
Fresh’s routing and middleware can handle your HTTP endpoints (including REST
APIs or SSR pages) without an Express-like third-party router. Its islands
system with Preact covers interactive UI needs without requiring a heavy
client-side framework for the whole app. By using Fresh’s integrated approach,
you eliminate many typical dependencies from a Node.js SaaS stack (such as
Next.js or React Router, body-parser, etc.), because Fresh 2.x and Deno provide
those capabilities natively. This leads to a more maintainable codebase and
fewer compatibility issues. •	Leverage Deno 2.x Enhancements for Productivity:
Deno 2 introduces features that help in multi-module projects and dependency
management, which is beneficial for SaaS apps that often have complex
structures. One such feature is Workspaces, allowing multiple projects or
packages in a monorepo to be managed together (similar to Nx or Lerna but built
into Deno). If your SaaS is composed of several services or packages (for
example, a core service, a CLI, maybe an shared library), use Deno’s workspace
support to develop them in one repository without extra tooling. Deno will
handle dependency resolution and configuration across the workspace. This
reduces the need for third-party monorepo tools and ensures consistency across
your SaaS components ￼ ￼. Additionally, Deno 2’s lockfile improvements ￼ mean
your deployments are predictable without needing additional package-lock or
shrinkwrap files from npm – use deno.lock as the single source of truth for
version locking. •	Minimize Polyfills and Shims by Targeting Deno’s Strengths:
In Node-based projects, it’s common to include polyfills or wrappers (for
example, to use ES modules, to support TypeScript, or to handle environment
differences). With Deno, these are unnecessary – TypeScript is supported
natively (no need for Babel or ts-node), and ES modules are the default (no
CommonJS boilerplate). Embrace Deno’s native TypeScript/JSX support and testing
tools (deno test) to avoid pulling in Jest, ts-jest, or similar libraries for
testing React components or business logic. One developer noted that using Deno
with Preact made testing React components much simpler, eliminating “all the
crud you have to install for Jest” ￼ ￼. The built-in test runner and assertion
library can handle most testing needs. By relying on Deno’s runtime features
(like Deno.test, Deno.bench, etc.), you cut out many dev-dependencies that a
typical Node project would require. •	Leverage Deno’s Built-in Services (where
appropriate): Deno is evolving to include built-in services like Deno KV, a
key-value database baked into the runtime ￼. If your SaaS needs a simple
database for config, session data, or caching, consider using Deno.Kv rather
than introducing an external database or a caching server. Deno KV works locally
(backed by an embedded store) and on Deno Deploy globally, with zero setup ￼.
This can replace the need for something like Redis or even a lightweight
relational DB for certain use cases, thus removing another third-party component
from your stack. Similarly, Deno’s built-in OpenTelemetry integration means you
can do tracing without adding OpenTelemetry SDK packages ￼. Always evaluate if a
new requirement can be fulfilled by Deno’s runtime (or std library) before
reaching for an off-platform solution. •	Carefully Use NPM Packages Only When
Necessary: Thanks to Deno 2’s polished Node compatibility, you have the option
to import npm packages seamlessly when needed ￼. This is great for leveraging
mature libraries (for example, Stripe SDKs, AWS SDK, etc.) that don’t have
direct Deno equivalents. However, each npm package you bring in is a third-party
dependency that may carry weight (performance, security, licensing). A best
practice in a Deno-based SaaS is to limit usage of npm modules to cases where
absolutely required, and prefer native Deno or web alternatives when possible.
If you do use npm packages, take advantage of Deno’s ability to cache and vendor
them (via deno vendor or lockfiles) to ensure you’re not relying on the network
at runtime. Also, test them thoroughly in Deno’s context – while Deno 2.x has
excellent support, not every Node library is guaranteed to work if it uses very
Node-specific features or C++ addons. The bottom line is: Deno 2 + Fresh 2 gives
you a powerful standard toolbox; use it to minimize what you must pull from
Node’s ecosystem, but be glad that when you do need that one library, you can
integrate it easily. •	Use Fresh Middleware and Plugins for Cross-Cutting
Concerns: Many SaaS applications require common web middleware (authentication,
logging, rate limiting, etc.). Fresh 2.x’s new middleware system (the .use() on
App) lets you implement these without external libraries. For example, you can
write a simple middleware to check a session cookie and redirect if
unauthorized, instead of using something like Express’s cookie-parser and
Passport. Similarly, you might implement request logging via a middleware that
uses Deno’s console or a minimal logging utility, rather than pulling in Winston
or Morgan. The Fresh team or community may also provide plugins (as Fresh 1 had
for things like Twind, OAuth, etc.); with the new plugin API, these can be more
flexible ￼ ￼. Choose Fresh-native solutions for these concerns to keep tight
integration and reduce dependency footprint.

In essence, building a SaaS on Deno 2.x and Fresh 2.x encourages a “lean”
architecture – you can achieve functionality with what’s built into the platform
rather than assembling a patchwork of packages. This results in better
performance (less overhead), improved security (fewer third-party codes to
audit), and easier maintenance. The combination of Deno’s robust runtime and
Fresh’s full-stack framework means your SaaS can handle everything from serving
pages to making outbound API calls and storing data, with minimal add-ons.

Porting Node.js Dependencies to Deno 2.x – Example: WorkOS SDK

One challenge when adopting Deno (especially in earlier days) was library
compatibility – many Node.js SDKs were not immediately usable in Deno. Deno 2.x
greatly alleviates this with Node/NPM compatibility, but sometimes you may want
a native Deno integration for a dependency. Porting a Node library to Deno can
range from trivial (just use it via npm import) to involved (rewriting parts of
it). Here we outline guidelines using the WorkOS SDK as an example scenario.

WorkOS provides an authentication/SSO API, and their official SDK was originally
written for Node. In March 2024, WorkOS updated their Node SDK to support Deno,
Cloudflare Workers, and other runtime environments ￼. How did this happen?
Essentially, they refactored the SDK to use standard APIs instead of
Node-specific ones. The lesson for porting is: if a library is relying on
Node-only features, replace those with web-standard or Deno-standard APIs. Here
are general steps: 1.	Assess the Library’s Dependencies: Determine what
Node-specific modules or calls are used. Common culprits are the Node http/https
module, fs module, or Node-specific globals like Buffer. For example, a typical
REST API SDK might use https.request internally to make API calls, and might use
process.env to get configuration, etc. List these out as targets for
replacement. 2.	Replace Networking and HTTP with fetch: Deno supports the fetch
API globally, which covers HTTP/HTTPS requests in a standards-compliant way. In
porting, remove usage of Node’s http module or third-party HTTP clients.
Instead, use await fetch(url, options) for requests. This often simplifies code.
The WorkOS SDK update, for instance, meant developers no longer had to use axios
or Node’s https in Deno – the SDK itself likely uses fetch under the hood now ￼.
If the library uses streaming requests or specific HTTP agents, Deno’s fetch can
handle streams and has options for TLS, so it should suffice in most cases.
3.	Use Deno’s Built-in APIs for File and OS Access: If the Node library reads
files or needs to access the file system (for caching, etc.), use Deno’s
Deno.readTextFile, Deno.writeTextFile, etc., or consider if that feature is
needed in a Deno context at all. Often, SDKs don’t do heavy FS operations except
maybe for reading configuration. You can also use web APIs like the File API or
IndexedDB in Deno if appropriate. The goal is to remove require('fs') and
similar calls, since Deno has permissions around file access – using Deno’s
Deno.fs methods will respect those. 4.	Polyfill or Replace Utility APIs: Node’s
global Buffer can be replaced with Uint8Array or ArrayBuffer in idiomatic Deno
code. If the library uses Buffer for binary data, in Deno you can usually use
new TextEncoder()/TextDecoder() for encoding strings, and crypto APIs for
hashing instead of Buffer-based methods. Deno provides a global Buffer object in
its Node compatibility layer (node:buffer), but for a more “Deno-native”
approach, refactoring to avoid Buffer entirely is possible. Similarly, if the
library uses Node’s EventEmitter, you might switch to using EventTarget (since
Deno supports EventTarget as a web standard). These changes make the codebase
more aligned with Deno’s environment. 5.	Remove or Replace Node-only Imports:
Some Node libraries import modules like util, stream, or specific Node
polyfills. Deno does have shims for many of these under the node: specifier (for
example, you can import "node:util" in Deno). But if you want a clean port, you
can often remove these or use Deno/std equivalents (std/node/util.ts etc.).
Check if the library is using a feature that Deno cannot support – e.g.,
child_process spawning. If it is, consider whether that feature is needed in
Deno or if there’s a workaround (like using Deno’s Deno.run for subprocesses).
In the context of an SDK like WorkOS, most likely it does not spawn processes;
it’s mainly making web requests and handling JSON, which Deno can do natively.
6.	Leverage Existing Cross-Platform Efforts: Before undertaking a full rewrite,
see if the maintainers provide a Deno or web version. As in our example, WorkOS
adjusted their package to support Deno. Many modern Node libraries are moving
toward cross-platform by using ESM and avoiding Node built-ins. If the library
uses fetch or other web standards by default, you might be able to use it in
Deno 2.x with minimal changes. Try simply importing it via npm: in a small test
file to see if it runs. If it does, you might not need a separate “Deno port” at
all – just include it as an npm dependency in your Fresh project (remember to
add --allow-net or other permissions when running, as those libs will need
them). 7.	Testing the Port: After making changes, test the library in a Deno
context. Write a few usage examples in a Deno script and run them to ensure it
behaves the same as in Node. Pay attention to things like case-sensitive import
paths (Deno is case-sensitive on all platforms, Node is not always), and default
exports vs named exports if converting from CommonJS to ESM. Also confirm that
performance is acceptable – Deno’s V8 and Rust infrastructure might behave
slightly differently for certain tasks, so profile if needed.

Example – WorkOS SDK via Fetch: To illustrate, suppose the WorkOS Node SDK had a
function to create an organization by sending a POST request. In Node
(pseudo-code) it might have been:

// Node-style (pseudo-code) https.request({ hostname: "api.workos.com", path:
"/organizations", method: "POST", headers: { "Authorization":
`Bearer ${API_KEY}`, ... } }, callback);

In a Deno environment, this can be ported to:

// Deno-style using fetch const resp = await
fetch("https://api.workos.com/organizations", { method: "POST", headers: {
"Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json", },
body: JSON.stringify(orgData), }); const result = await resp.json();

By using fetch, we eliminate the need for Node’s https module or any external
HTTP client. The code becomes runtime-agnostic (works in Deno, browsers,
Cloudflare Workers, etc.). This is essentially what WorkOS did – “instead of
having to make your own API calls in environments that don’t support older HTTP
libraries, you can now use our SDK” because it uses modern APIs internally ￼.
The same strategy can be applied to other libraries.

In summary, porting a dependency to Deno 2.x “natively” means refactoring it to
use the universal APIs and Deno’s built-ins that Deno supports, rather than
Node-specific ones. Often, this aligns with writing more standard-compliant
JavaScript/TypeScript, which is a good thing for longevity. With Deno 2.x’s
improved Node compatibility, the need for full rewrites is lessened – many Node
libraries will just work. But if you require maximum performance or minimal
overhead, a Deno-native port can remove shims and polyfills, resulting in a
cleaner integration. Always weigh the effort vs benefit: for some dependencies
(like cryptography or low-level binary parsing), using Deno’s standard or a
Deno-specific library might be better than porting a Node library. For others
(like cloud service SDKs), using them via npm is fine if they’re not heavy. The
guiding principle is to maximize compatibility and minimize unnecessary
abstraction. By doing so, your SaaS platform can run on Deno 2.x with all its
advantages, without being held back by legacy Node requirements.

Conclusion

Fresh 2.x and Deno 2.x together represent a modern, streamlined platform for
building web applications and SaaS services. Fresh 2.x’s alpha features already
give a glimpse of a simpler developer experience: no config files, more direct
control, and deeper integration with Deno’s ecosystem. When building with these
tools, embrace the new patterns (JSR modules, the App API, async components) and
Deno’s robust standard library to create applications that are efficient and
dependency-light. Migrating to this stack can be done in stages – thanks to
compatibility layers and Deno’s gradual migration path – so teams can start
taking advantage of Fresh 2.x features even before Deno 2 is fully adopted
everywhere. By following the best practices and guidelines above, you can build
a SaaS platform that not only takes full advantage of Deno 2.x’s capabilities
(from improved Node compatibility to built-in KV storage and more) but also
remains clean, secure, and easy to maintain. Fresh 2.x in alpha may still
evolve, but its core direction is clear: leveraging Deno’s strengths to reduce
complexity. Adopting it early allows you to stay ahead of the curve and deliver
fast, reliable services with less code and fewer moving parts ￼ ￼.

Sources: The information in this brief is based on the Fresh 2.0 roadmap
discussions ￼, official code changes and migration guides from the Fresh
repository ￼ ￼, community summaries of Deno v2 and Fresh v2 progress ￼ ￼, as
well as real-world insights on Deno 2.0’s impact on dependency management ￼ and
examples like the WorkOS SDK update for Deno compatibility ￼. These sources
reflect the state of Deno and Fresh as of early 2025, focusing on features
already available in alpha or slated for imminent release.
