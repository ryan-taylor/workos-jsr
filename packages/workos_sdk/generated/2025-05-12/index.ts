// Re-export DirectorySyncService for SDK compatibility
export { DirectorySyncService } from "./services/directory-sync.service.ts";

// Export a setWorkOSInstance utility function
let workosInstance: any = null;

export function setWorkOSInstance(instance: any): void {
  workosInstance = instance;
}

export function getWorkOSInstance(): any {
  return workosInstance;
}
