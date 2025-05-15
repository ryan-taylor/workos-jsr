/** @jsx h */
import { Fragment, h } from "preact";
import { useState } from "preact/hooks";

/**
 * SessionStatus Component
 *
 * This component demonstrates reading and updating session data in a Fresh 2.x application.
 * It displays the current session state and provides UI controls to interact with session data.
 *
 * The session lifecycle demonstrated includes:
 * 1. Reading session data (displaying current values)
 * 2. Modifying session data (adding custom data)
 * 3. Logging out (destroying the session)
 */
interface SessionProps {
  session: any;
  onUpdate?: (data: Record<string, unknown>) => Promise<void>;
}

export default function SessionStatus({ session, onUpdate }: SessionProps) {
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");

  // Format the session data for display
  const formatSessionData = (data: any) => {
    if (!data) return "No session data";
    return JSON.stringify(data, null, 2);
  };

  // Handle adding custom data to the session
  const handleAddData = async (e: Event) => {
    e.preventDefault();
    if (customKey && customValue && onUpdate) {
      await onUpdate({ [customKey]: customValue });
      setCustomKey("");
      setCustomValue("");
    }
  };

  // Calculate time since session creation or last modification
  const getSessionAge = () => {
    if (!session) return null;

    const timestamp = session.lastModified || session.createdAt;
    if (!timestamp) return null;

    const sessionTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - sessionTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    return diffMins < 1
      ? "Less than a minute ago"
      : `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  };

  return (
    <div class="session-status p-4 border rounded-md bg-gray-50">
      <h2 class="text-xl font-bold mb-2">Session Status</h2>

      {/* Display session information */}
      <div class="mb-4">
        <div class="flex mb-2">
          <span class="font-medium mr-2">Status:</span>
          <span class={session ? "text-green-600" : "text-red-600"}>
            {session ? "Active" : "Not active"}
          </span>
        </div>

        {session && (
          <Fragment>
            <div class="flex mb-2">
              <span class="font-medium mr-2">User:</span>
              <span>{session.profile?.email || "Unknown"}</span>
            </div>

            <div class="flex mb-2">
              <span class="font-medium mr-2">Last updated:</span>
              <span>{getSessionAge()}</span>
            </div>
          </Fragment>
        )}
      </div>

      {/* Session data modification form */}
      {session && onUpdate && (
        <div class="mt-4 border-t pt-4">
          <h3 class="font-medium mb-2">Add Custom Session Data</h3>
          <form onSubmit={handleAddData} class="flex flex-col gap-2">
            <div class="flex gap-2">
              <input
                type="text"
                placeholder="Key"
                value={customKey}
                onChange={(e) =>
                  setCustomKey((e.target as HTMLInputElement).value)}
                class="border p-1 flex-1"
              />
              <input
                type="text"
                placeholder="Value"
                value={customValue}
                onChange={(e) =>
                  setCustomValue((e.target as HTMLInputElement).value)}
                class="border p-1 flex-1"
              />
            </div>
            <button
              type="submit"
              class="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600 mt-2"
              disabled={!customKey || !customValue}
            >
              Update Session
            </button>
          </form>
        </div>
      )}

      {/* Display raw session data */}
      <div class="mt-4 border-t pt-4">
        <h3 class="font-medium mb-2">Raw Session Data</h3>
        <pre class="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap overflow-auto max-h-48">
          {formatSessionData(session)}
        </pre>
      </div>

      {/* Session logout */}
      {session && (
        <div class="mt-4 border-t pt-4">
          <h3 class="font-medium mb-2">Session Management</h3>
          <form method="post" action="/logout">
            <button
              type="submit"
              class="bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600"
            >
              End Session (Logout)
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
