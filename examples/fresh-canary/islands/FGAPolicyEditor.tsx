import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { exampleModels } from "../utils/fga.ts";

// Type definitions
interface ObjectType {
  name: string;
  description: string;
}

interface Relationship {
  source: string;
  relation: string;
  target: string;
  description: string;
}

interface AuthModel {
  objectTypes: ObjectType[];
  relationships: Relationship[];
}

// Helper component to render a relationship
function RelationshipItem({ 
  relationship, 
  onDelete 
}: { 
  relationship: Relationship;
  onDelete: () => void;
}) {
  return (
    <div class="relationship-item bg-gray-50 p-3 rounded mb-2 border border-gray-200 flex justify-between items-center">
      <div>
        <span class="font-medium text-blue-600">{relationship.source}</span>
        <span class="mx-2 italic text-gray-600">has relation</span>
        <span class="font-medium text-green-600">{relationship.relation}</span>
        <span class="mx-2 italic text-gray-600">with</span>
        <span class="font-medium text-purple-600">{relationship.target}</span>
        {relationship.description && (
          <p class="text-sm text-gray-500 mt-1">{relationship.description}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        class="ml-4 bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-sm"
      >
        Remove
      </button>
    </div>
  );
}

// Helper component to render an object type
function ObjectTypeItem({ 
  objectType, 
  onDelete 
}: { 
  objectType: ObjectType;
  onDelete: () => void;
}) {
  return (
    <div class="object-type-item bg-gray-50 p-3 rounded mb-2 border border-gray-200 flex justify-between items-center">
      <div>
        <span class="font-medium text-indigo-600">{objectType.name}</span>
        {objectType.description && (
          <p class="text-sm text-gray-500 mt-1">{objectType.description}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        class="ml-4 bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-sm"
      >
        Remove
      </button>
    </div>
  );
}

export default function FGAPolicyEditor() {
  // State for the current model
  const modelData = useSignal<AuthModel>({
    objectTypes: [],
    relationships: []
  });
  
  // New object type form
  const newObjectType = useSignal<{ name: string; description: string }>({
    name: "",
    description: ""
  });
  
  // New relationship form
  const newRelationship = useSignal<{ source: string; relation: string; target: string; description: string }>({
    source: "",
    relation: "",
    target: "",
    description: ""
  });
  
  // Example model selection
  const selectedExample = useSignal<string | null>(null);
  
  // Validation state
  const validationError = useSignal<string | null>(null);
  
  // JSON representation of the model
  const jsonPolicy = useComputed(() => {
    try {
      return JSON.stringify(modelData.value, null, 2);
    } catch (e) {
      return "{}";
    }
  });
  
  // Fetch resources and example models on mount
  useEffect(() => {
    // No need to actually fetch for the demo - we'll use the client-side examples
  }, []);
  
  // Handle example model selection
  const handleExampleSelect = (example: string) => {
    if (example in exampleModels) {
      selectedExample.value = example;
      // @ts-ignore - exampleModels key access
      modelData.value = exampleModels[example];
      validationError.value = null;
    }
  };
  
  // Handle adding a new object type
  const handleAddObjectType = () => {
    if (!newObjectType.value.name) {
      validationError.value = "Object type name is required";
      return;
    }
    
    // Check if name already exists
    if (modelData.value.objectTypes.some(ot => ot.name === newObjectType.value.name)) {
      validationError.value = `Object type '${newObjectType.value.name}' already exists`;
      return;
    }
    
    // Add to model
    modelData.value = {
      ...modelData.value,
      objectTypes: [
        ...modelData.value.objectTypes,
        {
          name: newObjectType.value.name,
          description: newObjectType.value.description
        }
      ]
    };
    
    // Reset form and error
    newObjectType.value = { name: "", description: "" };
    validationError.value = null;
  };
  
  // Handle adding a new relationship
  const handleAddRelationship = () => {
    if (!newRelationship.value.source || !newRelationship.value.relation || !newRelationship.value.target) {
      validationError.value = "Source, relation, and target are required";
      return;
    }
    
    // Check if source and target exist
    const sourceExists = modelData.value.objectTypes.some(ot => ot.name === newRelationship.value.source);
    const targetExists = modelData.value.objectTypes.some(ot => ot.name === newRelationship.value.target);
    
    if (!sourceExists) {
      validationError.value = `Source type '${newRelationship.value.source}' doesn't exist`;
      return;
    }
    
    if (!targetExists) {
      validationError.value = `Target type '${newRelationship.value.target}' doesn't exist`;
      return;
    }
    
    // Add to model
    modelData.value = {
      ...modelData.value,
      relationships: [
        ...modelData.value.relationships,
        {
          source: newRelationship.value.source,
          relation: newRelationship.value.relation,
          target: newRelationship.value.target,
          description: newRelationship.value.description
        }
      ]
    };
    
    // Reset form and error
    newRelationship.value = { source: "", relation: "", target: "", description: "" };
    validationError.value = null;
  };
  
  // Handle object type deletion
  const handleDeleteObjectType = (index: number) => {
    const objectType = modelData.value.objectTypes[index];
    
    // Check if any relationships use this object type
    const isUsed = modelData.value.relationships.some(
      rel => rel.source === objectType.name || rel.target === objectType.name
    );
    
    if (isUsed) {
      validationError.value = `Cannot delete object type '${objectType.name}' as it's used in one or more relationships`;
      return;
    }
    
    // Remove from model
    const newObjectTypes = [...modelData.value.objectTypes];
    newObjectTypes.splice(index, 1);
    modelData.value = {
      ...modelData.value,
      objectTypes: newObjectTypes
    };
    
    validationError.value = null;
  };
  
  // Handle relationship deletion
  const handleDeleteRelationship = (index: number) => {
    const newRelationships = [...modelData.value.relationships];
    newRelationships.splice(index, 1);
    modelData.value = {
      ...modelData.value,
      relationships: newRelationships
    };
    
    validationError.value = null;
  };
  
  // Submit the policy to the API
  const handleSavePolicy = async () => {
    try {
      // In a real implementation, we would send the policy to the API
      alert("In a real implementation, this would save the policy to WorkOS FGA");
      
      validationError.value = null;
    } catch (error) {
      validationError.value = error instanceof Error ? error.message : "Unknown error occurred";
    }
  };
  
  return (
    <div class="fga-policy-editor">
      <h2 class="text-2xl font-bold mb-4">Fine-Grained Authorization Policy Editor</h2>
      <p class="text-gray-600 mb-6">
        Create and edit authorization models with objects and their relationships.
      </p>
      
      {validationError.value && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {validationError.value}
        </div>
      )}
      
      {/* Example Selector */}
      <div class="example-selector mb-8">
        <h3 class="text-lg font-medium mb-2">Start with an Example Model</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExampleSelect("rbac")}
            class={`p-4 rounded border hover:shadow-md transition ${
              selectedExample.value === "rbac" 
                ? "bg-blue-50 border-blue-300" 
                : "bg-white border-gray-200"
            }`}
          >
            <h4 class="font-medium">Role-Based Access Control</h4>
            <p class="text-sm text-gray-600 mt-1">Users, roles, and permissions</p>
          </button>
          
          <button
            onClick={() => handleExampleSelect("documentAccess")}
            class={`p-4 rounded border hover:shadow-md transition ${
              selectedExample.value === "documentAccess" 
                ? "bg-blue-50 border-blue-300" 
                : "bg-white border-gray-200"
            }`}
          >
            <h4 class="font-medium">Document Access Control</h4>
            <p class="text-sm text-gray-600 mt-1">Documents, folders, and access levels</p>
          </button>
          
          <button
            onClick={() => handleExampleSelect("tenantAccess")}
            class={`p-4 rounded border hover:shadow-md transition ${
              selectedExample.value === "tenantAccess" 
                ? "bg-blue-50 border-blue-300" 
                : "bg-white border-gray-200"
            }`}
          >
            <h4 class="font-medium">Multi-Tenant System</h4>
            <p class="text-sm text-gray-600 mt-1">Users and tenants</p>
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="policy-editor-panel">
          {/* Object Types Section */}
          <div class="object-types-section mb-8">
            <h3 class="text-lg font-medium mb-2">Object Types</h3>
            <p class="text-sm text-gray-600 mb-4">Define the types of objects in your authorization model</p>
            
            <div class="object-types-list mb-4">
              {modelData.value.objectTypes.map((objectType, index) => (
                <ObjectTypeItem 
                  key={objectType.name}
                  objectType={objectType}
                  onDelete={() => handleDeleteObjectType(index)}
                />
              ))}
              
              {modelData.value.objectTypes.length === 0 && (
                <div class="text-gray-500 italic text-sm p-2">
                  No object types defined yet. Add your first one below.
                </div>
              )}
            </div>
            
            <div class="add-object-type bg-gray-50 p-4 rounded border border-gray-200">
              <h4 class="font-medium mb-2">Add Object Type</h4>
              <div class="mb-2">
                <label class="block text-sm text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  value={newObjectType.value.name}
                  onInput={(e) => newObjectType.value = { ...newObjectType.value, name: (e.target as HTMLInputElement).value }}
                  placeholder="e.g., user, document, role"
                />
              </div>
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  value={newObjectType.value.description}
                  onInput={(e) => newObjectType.value = { ...newObjectType.value, description: (e.target as HTMLInputElement).value }}
                  placeholder="e.g., A user in the system"
                />
              </div>
              <button
                onClick={handleAddObjectType}
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Add Object Type
              </button>
            </div>
          </div>
          
          {/* Relationships Section */}
          <div class="relationships-section">
            <h3 class="text-lg font-medium mb-2">Relationships</h3>
            <p class="text-sm text-gray-600 mb-4">Define the relationships between object types</p>
            
            <div class="relationships-list mb-4">
              {modelData.value.relationships.map((relationship, index) => (
                <RelationshipItem
                  key={`${relationship.source}-${relationship.relation}-${relationship.target}`}
                  relationship={relationship}
                  onDelete={() => handleDeleteRelationship(index)}
                />
              ))}
              
              {modelData.value.relationships.length === 0 && (
                <div class="text-gray-500 italic text-sm p-2">
                  No relationships defined yet. Add your first one below.
                </div>
              )}
            </div>
            
            <div class="add-relationship bg-gray-50 p-4 rounded border border-gray-200">
              <h4 class="font-medium mb-2">Add Relationship</h4>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                <div>
                  <label class="block text-sm text-gray-700 mb-1">Source Type</label>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded"
                    value={newRelationship.value.source}
                    onChange={(e) => newRelationship.value = { ...newRelationship.value, source: (e.target as HTMLSelectElement).value }}
                  >
                    <option value="">Select source</option>
                    {modelData.value.objectTypes.map(ot => (
                      <option key={ot.name} value={ot.name}>{ot.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-gray-700 mb-1">Relation</label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded"
                    value={newRelationship.value.relation}
                    onInput={(e) => newRelationship.value = { ...newRelationship.value, relation: (e.target as HTMLInputElement).value }}
                    placeholder="e.g., owner, member"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-700 mb-1">Target Type</label>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded"
                    value={newRelationship.value.target}
                    onChange={(e) => newRelationship.value = { ...newRelationship.value, target: (e.target as HTMLSelectElement).value }}
                  >
                    <option value="">Select target</option>
                    {modelData.value.objectTypes.map(ot => (
                      <option key={ot.name} value={ot.name}>{ot.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded"
                  value={newRelationship.value.description}
                  onInput={(e) => newRelationship.value = { ...newRelationship.value, description: (e.target as HTMLInputElement).value }}
                  placeholder="e.g., User can view a document"
                />
              </div>
              <button
                onClick={handleAddRelationship}
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Add Relationship
              </button>
            </div>
          </div>
        </div>
        
        <div class="policy-visualization">
          <h3 class="text-lg font-medium mb-2">Policy Visualization</h3>
          
          {/* JSON Policy Representation */}
          <div class="mb-6">
            <h4 class="font-medium text-sm text-gray-700 mb-2">JSON Representation</h4>
            <div class="bg-gray-800 text-white rounded p-4 font-mono text-sm overflow-auto max-h-80">
              <pre>{jsonPolicy.value}</pre>
            </div>
          </div>
          
          {/* Visualization */}
          <div class="mb-6">
            <h4 class="font-medium text-sm text-gray-700 mb-2">Graph Visualization</h4>
            <div class="bg-gray-50 border border-gray-200 rounded p-4 h-60 flex items-center justify-center">
              {modelData.value.objectTypes.length > 0 ? (
                <div class="text-center text-gray-500">
                  <p>This would render an interactive graph visualization of your authorization model.</p>
                  <p class="text-sm mt-2">
                    <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded mr-2">
                      {modelData.value.objectTypes.length} Object Types
                    </span>
                    <span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">
                      {modelData.value.relationships.length} Relationships
                    </span>
                  </p>
                </div>
              ) : (
                <p class="text-gray-500">
                  Add object types and relationships to visualize your authorization model
                </p>
              )}
            </div>
          </div>
          
          {/* Save Button */}
          <button
            onClick={handleSavePolicy}
            class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded font-medium"
            disabled={modelData.value.objectTypes.length === 0}
          >
            Save Authorization Policy
          </button>
        </div>
      </div>
    </div>
  );
}