import { useSignal } from "@preact/signals";
import { useState } from "preact/hooks";

// Type definitions
interface ResourceDefinition {
  resourceType: string;
  resourceId: string;
}

interface RelationshipCheck {
  resourceType: string;
  resourceId: string;
  relation: string;
  subjectType: string;
  subjectId: string;
}

interface CheckResult {
  result: boolean;
}

// Example scenarios to demonstrate common use cases
const exampleScenarios = [
  {
    name: "Role-based Access Check",
    description:
      "Check if a user has access to a permission through their role",
    check: {
      resourceType: "permission",
      resourceId: "view-reports",
      relation: "member",
      subjectType: "user",
      subjectId: "user-123",
    },
  },
  {
    name: "Document Access Check",
    description: "Check if a user can view a specific document",
    check: {
      resourceType: "document",
      resourceId: "doc-456",
      relation: "viewer",
      subjectType: "user",
      subjectId: "user-123",
    },
  },
  {
    name: "Organization Membership Check",
    description: "Check if a user is a member of an organization",
    check: {
      resourceType: "organization",
      resourceId: "org-789",
      relation: "member",
      subjectType: "user",
      subjectId: "user-123",
    },
  },
];

export default function FGARelationshipTester() {
  // Form state
  const resourceType = useSignal<string>("");
  const resourceId = useSignal<string>("");
  const relation = useSignal<string>("");
  const subjectType = useSignal<string>("");
  const subjectId = useSignal<string>("");

  // Check result
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  // Loading state
  const isLoading = useSignal<boolean>(false);

  // Error state
  const error = useSignal<string | null>(null);

  // History of checks
  const [checkHistory, setCheckHistory] = useState<
    Array<{
      check: RelationshipCheck;
      result: boolean;
      timestamp: Date;
    }>
  >([]);

  // Handle form submission
  const handleCheck = async () => {
    // Validate form
    if (
      !resourceType.value || !resourceId.value || !relation.value ||
      !subjectType.value || !subjectId.value
    ) {
      error.value = "All fields are required";
      return;
    }

    // Reset error and set loading state
    error.value = null;
    isLoading.value = true;

    try {
      // Prepare data for API call
      const checkData: RelationshipCheck = {
        resourceType: resourceType.value,
        resourceId: resourceId.value,
        relation: relation.value,
        subjectType: subjectType.value,
        subjectId: subjectId.value,
      };

      // Call the API
      const response = await fetch("/api/fga/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          op: "check",
          ...checkData,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Parse the response
      const result = await response.json();
      setCheckResult(result);

      // Add to history
      setCheckHistory([
        {
          check: checkData,
          result: result.result,
          timestamp: new Date(),
        },
        ...checkHistory,
      ]);
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : "An unknown error occurred";
    } finally {
      isLoading.value = false;
    }
  };

  // Load an example scenario
  const loadExample = (example: typeof exampleScenarios[0]) => {
    resourceType.value = example.check.resourceType;
    resourceId.value = example.check.resourceId;
    relation.value = example.check.relation;
    subjectType.value = example.check.subjectType;
    subjectId.value = example.check.subjectId;

    // Reset any previous results or errors
    setCheckResult(null);
    error.value = null;
  };

  // Clear the form
  const clearForm = () => {
    resourceType.value = "";
    resourceId.value = "";
    relation.value = "";
    subjectType.value = "";
    subjectId.value = "";
    setCheckResult(null);
    error.value = null;
  };

  return (
    <div class="fga-relationship-tester">
      <h2 class="text-2xl font-bold mb-4">Fine-Grained Authorization Tester</h2>
      <p class="text-gray-600 mb-6">
        Test permission checks using WorkOS FGA to validate your authorization
        model.
      </p>

      {/* Error display */}
      {error.value && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error.value}
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Check Form */}
        <div class="col-span-2">
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-medium mb-4">Authorization Check</h3>

            <div class="mb-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type
                  </label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded"
                    value={resourceType.value}
                    onInput={(e) =>
                      resourceType.value = (e.target as HTMLInputElement).value}
                    placeholder="e.g., document, permission"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Resource ID
                  </label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded"
                    value={resourceId.value}
                    onInput={(e) =>
                      resourceId.value = (e.target as HTMLInputElement).value}
                    placeholder="e.g., doc-123, view-reports"
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Relation
                </label>
                <input
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  value={relation.value}
                  onInput={(e) =>
                    relation.value = (e.target as HTMLInputElement).value}
                  placeholder="e.g., viewer, member, owner"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Subject Type
                  </label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded"
                    value={subjectType.value}
                    onInput={(e) =>
                      subjectType.value = (e.target as HTMLInputElement).value}
                    placeholder="e.g., user, group"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Subject ID
                  </label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded"
                    value={subjectId.value}
                    onInput={(e) =>
                      subjectId.value = (e.target as HTMLInputElement).value}
                    placeholder="e.g., user-123, admin-group"
                  />
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                onClick={handleCheck}
                disabled={isLoading.value}
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {isLoading.value ? "Checking..." : "Check Authorization"}
              </button>
              <button
                onClick={clearForm}
                class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded"
              >
                Clear Form
              </button>
            </div>

            {/* Result Display */}
            {checkResult && (
              <div
                class={`mt-6 p-4 rounded-lg ${
                  checkResult.result
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <h4 class="font-medium mb-2">Authorization Result:</h4>
                <div class="flex items-center">
                  <span
                    class={`text-lg font-bold ${
                      checkResult.result ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {checkResult.result ? "Authorized ✓" : "Unauthorized ✗"}
                  </span>
                  <div class="ml-4 text-sm text-gray-600">
                    Can{" "}
                    <span class="font-medium">
                      {subjectType.value}:{subjectId.value}
                    </span>{" "}
                    have relation{" "}
                    <span class="font-medium">{relation.value}</span> with{" "}
                    <span class="font-medium">
                      {resourceType.value}:{resourceId.value}
                    </span>?{" "}
                    <span class="font-bold">
                      {checkResult.result ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Check History */}
          {checkHistory.length > 0 && (
            <div class="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-medium mb-4">Check History</h3>
              <div class="overflow-auto max-h-60">
                {checkHistory.map((historyItem, index) => (
                  <div
                    key={index}
                    class={`p-3 mb-2 rounded ${
                      historyItem.result
                        ? "bg-green-50 border border-green-100"
                        : "bg-red-50 border border-red-100"
                    }`}
                  >
                    <div class="flex justify-between">
                      <span
                        class={`font-medium ${
                          historyItem.result ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {historyItem.result ? "Authorized ✓" : "Unauthorized ✗"}
                      </span>
                      <span class="text-xs text-gray-500">
                        {historyItem.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p class="text-sm text-gray-700 mt-1">
                      <span class="font-medium">
                        {historyItem.check.subjectType}:{historyItem.check
                          .subjectId}
                      </span>{" "}
                      to{" "}
                      <span class="font-medium">
                        {historyItem.check.relation}
                      </span>{" "}
                      with{" "}
                      <span class="font-medium">
                        {historyItem.check.resourceType}:{historyItem.check
                          .resourceId}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Example Scenarios */}
        <div>
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-medium mb-4">Example Scenarios</h3>
            <p class="text-gray-600 text-sm mb-4">
              Try these example scenarios to understand how FGA works in
              different contexts.
            </p>

            <div class="space-y-4">
              {exampleScenarios.map((example, index) => (
                <div
                  key={index}
                  class="border border-gray-200 rounded p-4 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => loadExample(example)}
                >
                  <h4 class="font-medium text-blue-700">{example.name}</h4>
                  <p class="text-sm text-gray-600 mt-1">
                    {example.description}
                  </p>
                  <div class="mt-2 text-xs text-gray-500">
                    <p>
                      <span class="font-medium">Resource:</span>{" "}
                      {example.check.resourceType}:{example.check.resourceId}
                    </p>
                    <p>
                      <span class="font-medium">Relation:</span>{" "}
                      {example.check.relation}
                    </p>
                    <p>
                      <span class="font-medium">Subject:</span>{" "}
                      {example.check.subjectType}:{example.check.subjectId}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-medium mb-4">About Authorization Checks</h3>
            <div class="text-sm text-gray-600 space-y-3">
              <p>
                Fine-grained authorization (FGA) allows you to define complex
                permissions models based on relationships between objects.
              </p>
              <p>
                A check verifies if a subject (like a user) has a specific
                relation (like "viewer") with a resource (like a document).
              </p>
              <p>
                The result tells you whether the relationship exists according
                to your defined authorization model.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
