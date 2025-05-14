// StylesDemo component demonstrates various styling techniques in Fresh
/** @jsx h */
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "https://deno.land/x/fresh@1.6.5/runtime.ts";

// Component Props Interface
interface StylesDemoProps {
  initialColor?: string;
}

export default function StylesDemo(
  { initialColor = "#635bff" }: StylesDemoProps,
) {
  // State for dynamic styling demonstration
  const [color, setColor] = useState(initialColor);
  const [fontSize, setFontSize] = useState(16);
  const [isHydrated, setIsHydrated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Detect hydration status
  useEffect(() => {
    if (IS_BROWSER) {
      setIsHydrated(true);
    }
  }, []);

  // Function to generate a random color
  const generateRandomColor = () => {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    setColor(randomColor);
  };

  // Function to increase font size
  const increaseFontSize = () => {
    setFontSize((prev) => prev < 28 ? prev + 2 : prev);
  };

  // Function to decrease font size
  const decreaseFontSize = () => {
    setFontSize((prev) => prev > 12 ? prev - 2 : prev);
  };

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prev) => prev === "light" ? "dark" : "light");
  };

  // Dynamic style objects for scoped and dynamic styling
  const containerStyle = {
    backgroundColor: theme === "light" ? "#ffffff" : "#333333",
    color: theme === "light" ? "#333333" : "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    margin: "20px 0",
  };

  const buttonStyle = {
    backgroundColor: color,
    color: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    margin: "0 8px 8px 0",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  };

  const dynamicTextStyle = {
    fontSize: `${fontSize}px`,
    color: color,
    transition: "all 0.3s ease",
    fontWeight: "bold",
    marginBottom: "15px",
  };

  return (
    <div style={containerStyle} class="styles-demo">
      <div class="hydration-status">
        <p>
          <strong>Component Status:</strong>{" "}
          <span class={isHydrated ? "hydrated" : "not-hydrated"}>
            {isHydrated ? "Hydrated ✅" : "Not Hydrated ⏳"}
          </span>
        </p>
      </div>

      <h2>Scoped Component Styling Demo</h2>

      {/* Scoped styling demonstration */}
      <section class="demo-section">
        <h3>1. Scoped Styling</h3>
        <p class="explanation">
          This component uses scoped styling that doesn't affect other parts of
          the application. Each section has its own styles that are applied only
          to elements within this component.
        </p>
        <div class="scoped-example">
          <p>This content has scoped styles applied.</p>
        </div>
      </section>

      {/* SSR and CSR consistent styling demonstration */}
      <section class="demo-section">
        <h3>2. SSR & CSR Consistent Styling</h3>
        <p class="explanation">
          The styling is consistent between server-side rendering and
          client-side hydration. There are no style flashes or layout shifts
          when the component hydrates.
        </p>
        <div class="ssr-csr-example">
          <p>This content looks the same before and after hydration.</p>
          <div class="ssr-csr-box">
            <span>Consistent Styling</span>
          </div>
        </div>
      </section>

      {/* Dynamic styling based on state demonstration */}
      <section class="demo-section">
        <h3>3. Dynamic Styling</h3>
        <p class="explanation">
          This demonstrates dynamic styling that changes based on component
          state. Try clicking the buttons below to see how the styling updates.
        </p>

        <p style={dynamicTextStyle}>
          This text has dynamic styling applied!
        </p>

        <div class="controls">
          <button
            style={buttonStyle}
            onClick={generateRandomColor}
            disabled={!isHydrated}
          >
            Change Color
          </button>

          <button
            style={buttonStyle}
            onClick={increaseFontSize}
            disabled={!isHydrated}
          >
            Increase Font Size
          </button>

          <button
            style={buttonStyle}
            onClick={decreaseFontSize}
            disabled={!isHydrated}
          >
            Decrease Font Size
          </button>

          <button
            style={buttonStyle}
            onClick={toggleTheme}
            disabled={!isHydrated}
          >
            Toggle Theme: {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
      </section>

      {/* CSS Variables demonstration */}
      <section class="demo-section">
        <h3>4. CSS Variables</h3>
        <p class="explanation">
          Using CSS variables from the global stylesheet for consistency across
          the application.
        </p>
        <div class="variables-example">
          <button class="primary-button">Primary Color Button</button>
          <button class="secondary-button">Secondary Color Button</button>
        </div>
      </section>
    </div>
  );
}
