// Hydration demonstration page
import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import HydrationDemo from "../../islands/HydrationDemo.tsx";

export const handler = {
  GET(_req: Request, ctx: any) {
    // Generate a server timestamp to demonstrate hydration differences
    const serverTime = new Date().toLocaleTimeString();
    return ctx.render({ serverTime });
  },
};

export default function HydrationPage({ data }: PageProps<{ serverTime: string }>) {
  const { serverTime } = data;
  
  return (
    <>
      <Head>
        <title>Hydration in Fresh - WorkOS Fresh Example</title>
        <link rel="stylesheet" href="/styles.css" />
        <style>{`
          .hydration-demo {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          
          .hydration-status {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
          }
          
          .hydrated {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
          }
          
          .not-hydrated {
            background-color: #fff3cd;
            border: 1px solid #ffeeba;
          }
          
          .content-display {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          
          .before-hydration {
            color: #856404;
          }
          
          .after-hydration {
            color: #155724;
          }
          
          .interactive-section {
            margin: 20px 0;
          }
          
          .counter button {
            padding: 8px 16px;
            border-radius: 4px;
            margin-right: 10px;
          }
          
          .counter button.active {
            background-color: #007bff;
            color: white;
            border: none;
            cursor: pointer;
          }
          
          .counter button.inactive {
            background-color: #e9ecef;
            color: #6c757d;
            border: 1px solid #ced4da;
            cursor: not-allowed;
          }
          
          .count-display {
            font-size: 1.2em;
            font-weight: bold;
          }
          
          .hydration-note {
            font-style: italic;
            color: #6c757d;
            font-size: 0.9em;
          }
          
          .metrics-section, .mismatch-section {
            margin-top: 25px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          
          .mismatch-warning {
            margin-top: 15px;
            padding: 10px;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            color: #721c24;
          }
          
          .note {
            font-size: 0.85em;
            color: #6c757d;
            font-style: italic;
          }
          
          .architecture-diagram {
            width: 100%;
            max-width: 800px;
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          
          .hydration-explanation {
            background-color: #e9f5fe;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          
          .code-example {
            background-color: #282c34;
            color: #abb2bf;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: monospace;
            margin: 15px 0;
          }
          
          .step {
            margin-bottom: 15px;
            padding-left: 20px;
            border-left: 3px solid #007bff;
          }
        `}</style>
      </Head>
      
      <div className="container">
        <header>
          <h1>Understanding Hydration in Fresh</h1>
          <p className="subtitle">How Fresh's Islands Architecture Delivers the Best of Both Worlds</p>
        </header>
        
        <section className="content-section">
          <h2>What is Hydration?</h2>
          
          <div className="hydration-explanation">
            <p>
              <strong>Hydration</strong> is the process where the JavaScript for interactive components 
              gets loaded and executed on the client side, "hydrating" the static HTML that was initially 
              rendered on the server.
            </p>
            
            <p>
              This approach gives you the best of both worlds:
            </p>
            
            <ul>
              <li><strong>Fast Initial Page Load</strong> - Server-rendered HTML appears quickly</li>
              <li><strong>SEO Benefits</strong> - Search engines see complete content</li>
              <li><strong>Progressive Enhancement</strong> - Base content works without JavaScript</li>
              <li><strong>Rich Interactivity</strong> - Components become fully interactive after hydration</li>
            </ul>
          </div>
        </section>
        
        <section className="content-section">
          <h2>Fresh's Islands Architecture</h2>
          
          <p>
            Fresh uses an "Islands Architecture" approach to hydration, which offers significant 
            performance benefits over traditional approaches.
          </p>
          
          <div className="architecture-diagram">
            <h3>How Islands Architecture Works:</h3>
            
            <div className="step">
              <h4>1. Server Rendering</h4>
              <p>
                The server renders the entire page as static HTML, including both static and interactive components.
              </p>
            </div>
            
            <div className="step">
              <h4>2. Selective Hydration</h4>
              <p>
                Unlike traditional approaches that hydrate the entire page, Fresh only hydrates specific 
                "islands" of interactivity (components in the <code>/islands</code> directory).
              </p>
            </div>
            
            <div className="step">
              <h4>3. Efficient Loading</h4>
              <p>
                JavaScript is only loaded for interactive components, not for static content. This 
                significantly reduces the amount of JavaScript shipped to the client.
              </p>
            </div>
            
            <div className="step">
              <h4>4. Parallel Processing</h4>
              <p>
                Each island hydrates independently, allowing for parallel processing and faster overall hydration.
              </p>
            </div>
          </div>
          
          <div className="code-example">
            <pre>{`// Example island component
// File: islands/Counter.tsx

import { useState } from "preact/hooks";

export default function Counter() {
  const [count, setState] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setState(count + 1)}>
        Increment
      </button>
    </div>
  );
}`}</pre>
          </div>
          
          <p>
            The component above will be server-rendered initially, but then hydrated on the client 
            to become interactive. Components outside the islands directory remain static.
          </p>
        </section>
        
        <section className="content-section">
          <h2>Hydration in Action</h2>
          <p>
            The demo below shows the hydration process in real-time. When you first load this page, 
            you see server-rendered HTML. As JavaScript loads, the components "hydrate" and become 
            interactive.
          </p>
          
          <HydrationDemo initialServerTime={serverTime} />
        </section>
        
        <section className="content-section">
          <h2>Technical Implementation</h2>
          
          <p>How Fresh handles hydration behind the scenes:</p>
          
          <ol>
            <li>
              <strong>Server-Side Rendering (SSR)</strong> - Fresh renders the entire page on the server, 
              including islands, generating static HTML.
            </li>
            <li>
              <strong>Islands Identification</strong> - During build time, Fresh identifies all island 
              components and generates the necessary client-side JavaScript bundles.
            </li>
            <li>
              <strong>Hydration Script Injection</strong> - A small hydration script is included in the 
              page that loads the JavaScript for each island.
            </li>
            <li>
              <strong>Selective Hydration</strong> - Only the interactive islands receive JavaScript, 
              saving bandwidth and improving performance.
            </li>
            <li>
              <strong>State Reconciliation</strong> - The client-side code reconciles any differences 
              between server and client renders (like the time example above).
            </li>
          </ol>
        </section>
        
        <section className="content-section">
          <h2>Benefits of Fresh's Approach</h2>
          
          <ul>
            <li>
              <strong>Minimal JavaScript</strong> - Ships significantly less JavaScript than traditional SPA frameworks
            </li>
            <li>
              <strong>Faster Page Loads</strong> - Initial HTML is delivered quickly from the server
            </li>
            <li>
              <strong>Progressive Enhancement</strong> - Core content works even before JavaScript loads
            </li>
            <li>
              <strong>Better Performance</strong> - Selective hydration means less work for the browser
            </li>
            <li>
              <strong>Improved Metrics</strong> - Better Core Web Vitals scores due to less JavaScript processing
            </li>
          </ul>
        </section>
        
        <section className="content-section">
          <h2>Hydration Challenges</h2>
          
          <p>
            While hydration provides many benefits, there are challenges to be aware of:
          </p>
          
          <ul>
            <li>
              <strong>Hydration Mismatches</strong> - Differences between server and client renders can cause issues
            </li>
            <li>
              <strong>Flickering</strong> - Content can sometimes "flicker" during hydration if there are mismatches
            </li>
            <li>
              <strong>Initial Non-Interactivity</strong> - Components aren't interactive until hydration completes
            </li>
          </ul>
          
          <p>
            Fresh handles these challenges well through its architecture and reconciliation process, 
            but developers should still be aware of potential issues.
          </p>
        </section>
        
        <section className="content-section">
          <h2>Best Practices</h2>
          
          <ul>
            <li>
              <strong>Keep Islands Small</strong> - Only make components islands if they need interactivity
            </li>
            <li>
              <strong>Minimize State Inconsistency</strong> - Avoid content that could differ between server and client
            </li>
            <li>
              <strong>Provide Loading States</strong> - Consider the pre-hydration appearance of interactive elements
            </li>
            <li>
              <strong>Use Island Props Carefully</strong> - Be aware that props passed to islands must be serializable
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}