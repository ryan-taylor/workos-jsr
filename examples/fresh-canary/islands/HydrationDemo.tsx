// HydrationDemo component shows the hydration process in action
/** @jsx h */
import { h } from "preact";
import { useEffect, useRef, useState } from 'preact/hooks';
import { IS_BROWSER } from 'https://deno.land/x/fresh@1.6.5/runtime.ts';

interface HydrationDemoProps {
  initialServerTime?: string;
}

export default function HydrationDemo({ initialServerTime }: HydrationDemoProps) {
  // State to track hydration status
  const [isHydrated, setIsHydrated] = useState(false);

  // Counter state that only works after hydration
  const [count, setCount] = useState(0);

  // Timing metrics
  const [hydrationTime, setHydrationTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Ref to track hydration mismatches
  const [mismatchDetected, setMismatchDetected] = useState(false);
  const mismatchRef = useRef<HTMLDivElement>(null);

  // Server vs client time for demonstrating mismatches
  const clientTime = new Date().toLocaleTimeString();

  // Effect that runs only in the browser after hydration
  useEffect(() => {
    if (IS_BROWSER) {
      // Mark the component as hydrated
      setIsHydrated(true);

      // Calculate hydration time if we have a start time
      if (startTimeRef.current) {
        const endTime = performance.now();
        const timeToHydrate = endTime - startTimeRef.current;
        setHydrationTime(timeToHydrate);
      }

      // Check for hydration mismatches (comparing server vs client rendered content)
      if (initialServerTime && initialServerTime !== clientTime) {
        setMismatchDetected(true);
      }
    }
  }, []);

  // Set start time for hydration measurement
  if (IS_BROWSER && !startTimeRef.current) {
    startTimeRef.current = performance.now();
  }

  // Create a random number on the server that will be different on the client
  // This is intentional to demonstrate a hydration mismatch
  const randomValue = Math.floor(Math.random() * 100);

  // Increment counter (only works after hydration)
  const incrementCounter = () => {
    setCount((prevCount) => prevCount + 1);
  };

  return (
    <div className='hydration-demo'>
      <h2>Hydration Demonstration</h2>

      {/* Status section */}
      <div className='status-section'>
        <h3>Hydration Status</h3>
        <div className={`hydration-status ${isHydrated ? 'hydrated' : 'not-hydrated'}`}>
          <p>
            <strong>Component is:</strong> <span>{isHydrated ? 'Hydrated ✅' : 'Not Hydrated ⏳'}</span>
          </p>
        </div>

        {/* This content changes after hydration */}
        <div className='content-before-after'>
          <h3>Content Transformation</h3>
          <div className='content-display'>
            {isHydrated
              ? (
                <div className='after-hydration'>
                  <p>
                    This content is displayed <strong>after</strong> hydration
                  </p>
                  <p>The Fresh islands architecture has successfully hydrated this component!</p>
                </div>
              )
              : (
                <div className='before-hydration'>
                  <p>
                    This content is displayed <strong>before</strong> hydration
                  </p>
                  <p>This static HTML was rendered on the server and will be replaced.</p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Interactive counter - only works after hydration */}
      <div className='interactive-section'>
        <h3>Interactive Counter</h3>
        <p>This counter only works after client-side hydration:</p>
        <div className='counter'>
          <button
            onClick={incrementCounter}
            disabled={!isHydrated}
            className={isHydrated ? 'active' : 'inactive'}
          >
            {isHydrated ? 'Click to Increment' : 'Waiting for Hydration...'}
          </button>
          <p className='count-display'>Count: {count}</p>
          {!isHydrated && (
            <p className='hydration-note'>
              (Counter is not interactive until JavaScript hydrates the component)
            </p>
          )}
        </div>
      </div>

      {/* Hydration timing metrics */}
      <div className='metrics-section'>
        <h3>Hydration Metrics</h3>
        {hydrationTime !== null
          ? (
            <p>
              <strong>Time to Hydrate:</strong> {hydrationTime.toFixed(2)}ms
            </p>
          )
          : <p>Calculating hydration time...</p>}
      </div>

      {/* Hydration mismatch demonstration */}
      <div className='mismatch-section' ref={mismatchRef}>
        <h3>Hydration Mismatch Detection</h3>

        <div className='mismatch-demo'>
          <p>
            <strong>Server Time:</strong> {initialServerTime || 'Unknown'}
          </p>
          <p>
            <strong>Client Time:</strong> {clientTime}
          </p>

          <div className='random-value'>
            <p>
              <strong>Random Value:</strong> {randomValue}
              <span className='note'>(changes between server/client to demonstrate mismatch)</span>
            </p>
          </div>

          {mismatchDetected && (
            <div className='mismatch-warning'>
              <p>⚠️ Hydration Mismatch Detected!</p>
              <p>The server-rendered content doesn't match the client content.</p>
              <p className='explanation'>
                In real applications, mismatches can cause UI flickering or unexpected behavior. Fresh handles these gracefully by applying
                client-side changes after hydration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
