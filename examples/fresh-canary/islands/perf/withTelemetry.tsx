// Island component performance monitoring HOC
/** @jsx h */
import { h } from "preact";
import {
  type ComponentChildren,
  type ComponentType,
  createContext,
  type VNode,
} from "preact";
import {
  useEffect,
  useErrorBoundary,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { recordMetric } from "../../utils/telemetry.ts";

// Context for telemetry data
const TelemetryContext = createContext<{
  componentName: string;
  recordInteraction: (
    eventName: string,
    detail?: Record<string, unknown>,
  ) => void;
}>({
  componentName: "unknown",
  recordInteraction: () => {},
});

/**
 * Error boundary component for catching and reporting render errors
 */
function ErrorBoundary(props: {
  componentName: string;
  children: ComponentChildren;
  fallback:
    | ((props: { error: Error; reset: () => void }) => VNode)
    | ((error: Error, reset: () => void) => VNode);
}) {
  const [error, reset] = useErrorBoundary();

  useEffect(() => {
    if (error) {
      // Record error metric
      recordMetric("island_render_error", 1, {
        componentName: props.componentName,
        errorMessage: error.message,
        errorName: error.name,
      });

      console.error(
        `[Telemetry] Render error in ${props.componentName}:`,
        error,
      );
    }
  }, [error, props.componentName]);

  if (error) {
    // Check if the fallback is using the object parameter style or the separate parameters style
    // This handles both function signatures
    if (props.fallback.length === 1) {
      // Object parameter style: fallback({ error, reset })
      return (props.fallback as (
        props: { error: Error; reset: () => void },
      ) => VNode)({ error, reset });
    } else {
      // Separate parameters style: fallback(error, reset)
      return (props.fallback as (error: Error, reset: () => void) => VNode)(
        error,
        reset,
      );
    }
  }

  return props.children as VNode;
}

// Default error fallback UI
function DefaultErrorFallback(
  { error, reset }: { error: Error; reset: () => void },
) {
  return (
    <div class="island-error">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

/**
 * Higher-order component that adds telemetry to island components
 */
export function withTelemetry<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: {
    componentName?: string;
    trackInteractions?: boolean;
    errorFallback?: (error: Error, reset: () => void) => VNode;
  } = {},
) {
  const componentName = options.componentName || WrappedComponent.displayName ||
    WrappedComponent.name || "UnknownComponent";
  const trackInteractions = options.trackInteractions !== false; // Default to true
  const errorFallback = options.errorFallback || DefaultErrorFallback;

  // Return the wrapped component
  function TelemetryWrappedComponent(props: P) {
    const startTime = useRef(performance.now());
    const hydrated = useRef(false);
    const mountTime = useRef<number | null>(null);
    const [interactionCount, setInteractionCount] = useState(0);

    // Record initial render time on component mount
    useLayoutEffect(() => {
      const now = performance.now();
      const renderTime = now - startTime.current;
      mountTime.current = now;

      recordMetric("island_render_time", renderTime, {
        componentName,
        isHydration: "false",
      });

      // Check if this is a hydration or a client-side render
      if (!hydrated.current) {
        hydrated.current = true;

        // We consider this a hydration if it happens within 1s of page load
        const timeSincePageLoad = now -
          (globalThis.performance?.timing?.domContentLoadedEventEnd || 0);
        const isHydration = timeSincePageLoad < 1000;

        if (isHydration) {
          recordMetric("island_hydration_time", renderTime, {
            componentName,
          });
        }
      }

      return () => {
        // Record unmount event
        recordMetric("island_unmount", 1, {
          componentName,
          visibleDuration: mountTime.current
            ? (performance.now() - mountTime.current).toString()
            : "unknown",
          interactionCount: interactionCount.toString(),
        });
      };
    }, []);

    // Function to record interaction events
    const recordInteraction = (
      eventName: string,
      detail: Record<string, unknown> = {},
    ) => {
      setInteractionCount((prev) => prev + 1);
      recordMetric("island_interaction", 1, {
        componentName,
        eventName,
        ...Object.fromEntries(
          Object.entries(detail)
            .filter(([_, v]) => typeof v === "string")
            .map(([k, v]) => [k, v as string]),
        ),
      });
    };

    // Set up global interaction tracking if enabled
    useEffect(() => {
      if (!trackInteractions) return;

      // Find the DOM element for this component
      // This is a simplified approach; in a real app we would use refs
      const componentElement = document.querySelector(
        `[data-island="${componentName}"]`,
      );
      if (!componentElement) return;

      // Track interactions on this element
      const handleEvent = (event: Event) => {
        recordInteraction(event.type, {
          targetTag: (event.target as HTMLElement)?.tagName?.toLowerCase() ||
            "unknown",
          targetId: (event.target as HTMLElement)?.id || "none",
          targetClass: (event.target as HTMLElement)?.className || "none",
        });
      };

      // Track common interaction events
      const eventsToTrack = ["click", "submit", "change", "keydown"];

      eventsToTrack.forEach((eventType) => {
        componentElement.addEventListener(eventType, handleEvent);
      });

      return () => {
        eventsToTrack.forEach((eventType) => {
          componentElement.removeEventListener(eventType, handleEvent);
        });
      };
    }, [trackInteractions]);

    return (
      <ErrorBoundary componentName={componentName} fallback={errorFallback}>
        <TelemetryContext.Provider value={{ componentName, recordInteraction }}>
          <div data-island={componentName}>
            <WrappedComponent {...props} />
          </div>
        </TelemetryContext.Provider>
      </ErrorBoundary>
    );
  }

  // Set displayName for debugging
  TelemetryWrappedComponent.displayName = `withTelemetry(${componentName})`;

  return TelemetryWrappedComponent;
}

/**
 * Hook to access telemetry context in child components
 */
export function useTelemetry() {
  return createContext;
}

export { TelemetryContext };
