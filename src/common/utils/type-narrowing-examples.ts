/**
 * Examples demonstrating how to use the type narrowing utilities with OpenAPI generated code
 * 
 * This file provides practical examples of using the type guard and assertion utilities
 * to work with 'unknown' types safely in the context of API responses.
 */

import {
  isString,
  isNumber, 
  isArray,
  isObject,
  hasProperty,
  isBoolean,
  isNullOrUndefined
} from "./type-guards.ts";

import {
  assertType,
  safeCast,
  assertShape,
  satisfies,
  TypeAssertionError
} from "./type-assertions.ts";

// Example 1: Basic Type Narrowing with Type Guards
// -----------------------------------------------

/**
 * Example showing basic type narrowing with OpenAPI response data
 */
function example1(apiResponse: unknown): void {
  console.log("Example 1: Basic Type Narrowing");
  
  // Check if response is an object
  if (isObject(apiResponse)) {
    console.log("Response is an object with properties:", Object.keys(apiResponse));
    
    // Check if the object has a specific property
    if (hasProperty(apiResponse, "data")) {
      console.log("Response has 'data' property:", apiResponse.data);
      
      // Check if data is an array
      if (isArray(apiResponse.data)) {
        console.log("Data is an array with length:", apiResponse.data.length);
        
        // Process each item in the array
        apiResponse.data.forEach((item, index) => {
          if (isObject(item) && hasProperty(item, "id") && isString(item.id)) {
            console.log(`Item ${index} ID:`, item.id);
          }
        });
      }
    }
  } else {
    console.log("Response is not an object");
  }
}

// Example 2: Using Type Assertions for More Direct Access
// ------------------------------------------------------

interface User {
  id: string;
  email: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Example showing use of assertions for working with API response
 */
function example2(apiResponse: unknown): User {
  console.log("Example 2: Using Type Assertions");
  
  try {
    // Assert the response is an object
    const responseObj = assertType(apiResponse, isObject, "object");
    
    // Assert the response has a data property
    if (!hasProperty(responseObj, "data")) {
      throw new TypeAssertionError("Response missing 'data' property");
    }
    
    // Assert data is an object and matches User shape
    const user = assertShape<User>(
      responseObj.data,
      (obj): obj is User => 
        isObject(obj) &&
        hasProperty(obj, "id") && isString(obj.id) &&
        hasProperty(obj, "email") && isString(obj.email) &&
        hasProperty(obj, "created_at") && isString(obj.created_at) &&
        (!hasProperty(obj, "metadata") || isNullOrUndefined(obj.metadata) || isObject(obj.metadata)),
      "User"
    );
    
    console.log("Successfully validated user:", user);
    return user;
  } catch (error) {
    if (error instanceof TypeAssertionError) {
      console.error("Type validation failed:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
}

// Example 3: Working with Array Responses
// --------------------------------------

interface Organization {
  id: string;
  name: string;
  domains: string[];
  created_at: string;
}

/**
 * Example showing safe handling of array responses
 */
function example3(apiResponse: unknown): Organization[] {
  console.log("Example 3: Working with Array Responses");
  
  // First, verify the response is an object
  if (!isObject(apiResponse) || !hasProperty(apiResponse, "data")) {
    throw new TypeAssertionError("Invalid response format");
  }
  
  // Verify data is an array
  if (!isArray(apiResponse.data)) {
    throw new TypeAssertionError("Expected data to be an array");
  }
  
  // Map and validate each organization
  return apiResponse.data.map((item, index) => {
    // Validate each item in the array
    if (!isObject(item)) {
      throw new TypeAssertionError(`Item at index ${index} is not an object`);
    }
    
    // Validate required properties
    if (!hasProperty(item, "id") || !isString(item.id)) {
      throw new TypeAssertionError(`Item at index ${index} has invalid 'id'`);
    }
    
    if (!hasProperty(item, "name") || !isString(item.name)) {
      throw new TypeAssertionError(`Item at index ${index} has invalid 'name'`);
    }
    
    if (!hasProperty(item, "created_at") || !isString(item.created_at)) {
      throw new TypeAssertionError(`Item at index ${index} has invalid 'created_at'`);
    }
    
    // Validate domains is an array of strings
    if (!hasProperty(item, "domains") || !isArray(item.domains)) {
      throw new TypeAssertionError(`Item at index ${index} has invalid 'domains'`);
    }
    
    // Check each domain is a string
    for (let i = 0; i < item.domains.length; i++) {
      if (!isString(item.domains[i])) {
        throw new TypeAssertionError(
          `Domain at index ${i} for organization ${index} is not a string`
        );
      }
    }
    
    // At this point TypeScript knows item has the correct shape
    return item as Organization;
  });
}

// Example 4: Using the Satisfies Utility
// -------------------------------------

interface ApiResponse<T> {
  status: string;
  data: T;
  timestamp: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

/**
 * Example using the satisfies utility for complex validation
 */
function example4(apiResponse: unknown): Product {
  console.log("Example 4: Using the Satisfies Utility");
  
  // Define a validator function for the API response shape
  const isApiResponse = <T>(
    response: unknown,
    dataValidator: (data: unknown) => data is T
  ): response is ApiResponse<T> => {
    return (
      isObject(response) &&
      hasProperty(response, "status") && isString(response.status) &&
      hasProperty(response, "data") && dataValidator(response.data) &&
      hasProperty(response, "timestamp") && isString(response.timestamp)
    );
  };
  
  // Define a validator function for the Product shape
  const isProduct = (data: unknown): data is Product => {
    return (
      isObject(data) &&
      hasProperty(data, "id") && isString(data.id) &&
      hasProperty(data, "name") && isString(data.name) &&
      hasProperty(data, "price") && isNumber(data.price) &&
      hasProperty(data, "active") && isBoolean(data.active)
    );
  };
  
  // Use satisfies to validate the response
  const validResponse = satisfies<ApiResponse<Product>>(
    apiResponse,
    (value): value is ApiResponse<Product> => isApiResponse(value, isProduct),
    "ApiResponse<Product>"
  );
  
  return validResponse.data;
}

// Example 5: Practical API Response Handling
// ----------------------------------------

/**
 * Example of a typical API response handler using the type narrowing utilities
 */
async function fetchAndProcessUser(userId: string): Promise<User> {
  try {
    // Simulate API call with unknown response type
    const response: unknown = await fetch(`/api/users/${userId}`).then(res => res.json());
    
    // First approach: Step-by-step narrowing
    if (!isObject(response)) {
      throw new Error("Invalid API response format");
    }
    
    if (!hasProperty(response, "success") || !isBoolean(response.success)) {
      throw new Error("Missing success indicator");
    }
    
    if (!response.success) {
      // Handle error response
      const errorMessage = hasProperty(response, "error") && isString(response.error) 
        ? response.error 
        : "Unknown error";
      throw new Error(`API error: ${errorMessage}`);
    }
    
    if (!hasProperty(response, "data") || !isObject(response.data)) {
      throw new Error("Invalid data in API response");
    }
    
    // Validate user object shape
    const requiredProps = ["id", "email", "created_at"];
    for (const prop of requiredProps) {
      if (!hasProperty(response.data, prop) || !isString(response.data[prop])) {
        throw new Error(`Invalid or missing ${prop} in user data`);
      }
    }
    
    // At this point, we've narrowed the type enough to safely use it
    // We need to explicitly cast the strings since TypeScript doesn't automatically narrow here
    return {
      id: response.data.id as string,
      email: response.data.email as string,
      created_at: response.data.created_at as string,
      metadata: hasProperty(response.data, "metadata") && isObject(response.data.metadata)
        ? response.data.metadata
        : undefined
    };
    
    // Alternative approach using our assertion utilities (better type safety):
    // return assertShape<User>(
    //   response.data,
    //   (obj): obj is User =>
    //     isObject(obj) &&
    //     hasProperty(obj, "id") && isString(obj.id) &&
    //     hasProperty(obj, "email") && isString(obj.email) &&
    //     hasProperty(obj, "created_at") && isString(obj.created_at) &&
    //     (!hasProperty(obj, "metadata") || isObject(obj.metadata)),
    //   "User"
    // );
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

// Export examples for reference
export {
  example1,
  example2,
  example3,
  example4,
  fetchAndProcessUser
};