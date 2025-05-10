// Styling demonstration page
import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import StylesDemo from "../../islands/StylesDemo.tsx";

export default function StylingPage(_props: PageProps) {
  return (
    <>
      <Head>
        <title>Styling in Fresh - WorkOS Fresh Example</title>
        <link rel="stylesheet" href="/styles.css" />
        <style>{`
          /* Page-specific styles */
          .styling-section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: var(--box-shadow);
          }
          
          .code-block {
            background-color: #282c34;
            color: #abb2bf;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: monospace;
            margin: 15px 0;
          }
          
          .approach-card {
            border: 1px solid #eee;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
          }
          
          .approach-card h4 {
            color: var(--primary-color);
            margin-bottom: 10px;
          }
          
          .advantages-list {
            margin-top: 10px;
          }
          
          .advantages-list li {
            margin-bottom: 5px;
          }
          
          .method-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          
          @media (max-width: 768px) {
            .method-comparison {
              grid-template-columns: 1fr;
            }
          }
          
          .best-practices li {
            margin-bottom: 10px;
          }
          
          /* Demo styles */
          .styles-demo .hydration-status {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
          }
          
          .styles-demo .hydrated {
            color: #28a745;
            font-weight: bold;
          }
          
          .styles-demo .not-hydrated {
            color: #ffc107;
            font-weight: bold;
          }
          
          .styles-demo .demo-section {
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          
          .styles-demo .explanation {
            font-style: italic;
            color: #666;
            margin-bottom: 15px;
          }
          
          .styles-demo .scoped-example {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid var(--primary-color);
          }
          
          .styles-demo .ssr-csr-example .ssr-csr-box {
            display: inline-block;
            padding: 10px 15px;
            background-color: var(--primary-color);
            color: white;
            border-radius: 4px;
            margin-top: 10px;
          }
          
          .styles-demo .variables-example {
            margin-top: 15px;
          }
          
          .styles-demo .primary-button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-right: 8px;
          }
          
          .styles-demo .secondary-button {
            background-color: var(--secondary-color);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
          }
        `}</style>
      </Head>
      
      <div className="container">
        <h1>Styling Approaches in Fresh</h1>
        <p>
          Implementing effective styling strategies with Fresh's islands architecture requires 
          understanding how styles work across server-side rendering and client-side hydration.
        </p>
        
        <section className="styling-section">
          <h2>Current Styling Approach</h2>
          <p>
            This Fresh example currently uses a combination of styling approaches to create a 
            consistent and maintainable UI while ensuring compatibility with Fresh's islands architecture.
          </p>
          
          <div className="method-comparison">
            <div className="approach-card">
              <h4>1. Global CSS Stylesheet</h4>
              <p>
                Base styles and common components are defined in a global stylesheet at 
                <code>/static/styles.css</code> using CSS variables for theming and consistency.
              </p>
              <ul className="advantages-list">
                <li>Provides consistent styling across the entire application</li>
                <li>Leverages CSS variables for easy theming</li>
                <li>Works well with both static routes and interactive islands</li>
              </ul>
            </div>
            
            <div className="approach-card">
              <h4>2. Component-Scoped CSS</h4>
              <p>
                Route-specific and component-specific styles are defined using the <code>&lt;style&gt;</code> tag 
                in the route or component file, scoped to specific class names.
              </p>
              <ul className="advantages-list">
                <li>Keeps component-specific styles close to the component code</li>
                <li>Prevents style leaking and naming conflicts</li>
                <li>Makes components more maintainable and self-contained</li>
              </ul>
            </div>
          </div>
          
          <div className="method-comparison">
            <div className="approach-card">
              <h4>3. Inline Styles</h4>
              <p>
                Dynamic styles that change based on component state or props can be applied 
                using inline style objects, especially useful for interactive island components.
              </p>
              <ul className="advantages-list">
                <li>Allows for dynamic styling based on component state</li>
                <li>No hydration mismatch issues with style changes</li>
                <li>Simplifies complex conditional styling logic</li>
              </ul>
            </div>
            
            <div className="approach-card">
              <h4>4. CSS Variables</h4>
              <p>
                CSS variables defined in the root selector provide consistent theming across 
                both global styles and component-specific styles.
              </p>
              <ul className="advantages-list">
                <li>Single source of truth for design tokens</li>
                <li>Easy to update theme colors and values</li>
                <li>Works consistently in both SSR and CSR contexts</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section className="styling-section">
          <h2>Why Not Tailwind CSS?</h2>
          <p>
            While Tailwind CSS is a popular choice for many projects, our current approach was chosen to:
          </p>
          <ul>
            <li>Keep the dependency footprint minimal</li>
            <li>Maintain full control over the styling approach</li>
            <li>Avoid additional build steps in the development workflow</li>
            <li>Make it easier to understand how styles are applied without learning Tailwind's utility classes</li>
          </ul>
          <p>
            However, Fresh does support Tailwind CSS via the Tailwind plugin if that's preferred for your project.
          </p>
        </section>
        
        <section className="styling-section">
          <h2>Best Practices for Styling in Fresh</h2>
          <ul className="best-practices">
            <li>
              <strong>Avoid direct styling of islands components in global CSS</strong> - 
              This can lead to hydration mismatches if the styles affect layout.
            </li>
            <li>
              <strong>Use CSS variables for theming</strong> - 
              Define colors, spacing, and other design tokens as CSS variables for consistency.
            </li>
            <li>
              <strong>Apply dynamic styles with inline style objects</strong> - 
              For styles that change based on state, inline style objects work best in islands.
            </li>
            <li>
              <strong>Keep component-specific styles scoped</strong> - 
              Use unique class names or component-scoped CSS to prevent style leaking.
            </li>
            <li>
              <strong>Consider the non-hydrated state</strong> - 
              Make sure components look good before hydration completes, avoiding layout shifts.
            </li>
          </ul>
        </section>
        
        <section className="styling-section">
          <h2>Styling Demo</h2>
          <p>
            The demo below illustrates different styling approaches and how they work with Fresh's islands architecture:
          </p>
          
          <StylesDemo initialColor="#635bff" />
        </section>
        
        <section className="styling-section">
          <h2>Implementation Examples</h2>
          
          <h3>1. Global CSS Variables</h3>
          <div className="code-block">
            <pre>{`/* In static/styles.css */
:root {
  --primary-color: #635bff;
  --secondary-color: #7a73ff;
  --background-color: #f9f9f9;
  --text-color: #333;
  --box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}`}</pre>
          </div>
          
          <h3>2. Component-Scoped CSS</h3>
          <div className="code-block">
            <pre>{`/* In route file */
<Head>
  <style>{
    .component-name .element {
      property: value;
    }
  }</style>
</Head>`}</pre>
          </div>
          
          <h3>3. Inline Styles for Dynamic Styling</h3>
          <div className="code-block">
            <pre>{`// In island component
const [color, setColor] = useState('#635bff');

// Create style object
const buttonStyle = {
  backgroundColor: color,
  color: "#ffffff",
  padding: "8px 16px",
  borderRadius: "4px"
};

// Apply to element
<button style={buttonStyle} onClick={() => setColor('#ff4565')}>
  Change Color
</button>`}</pre>
          </div>
          
          <h3>4. CSS Variables in Component Styles</h3>
          <div className="code-block">
            <pre>{`/* In component-scoped CSS */
.my-component .button {
  background-color: var(--primary-color);
  color: white;
  /* Other styles */
}`}</pre>
          </div>
        </section>
      </div>
    </>
  );
}