interface WorkOsResponseConfig {
  // Add any specific properties needed for the config
  // This is a placeholder type to avoid using 'any'
  [key: string]: unknown;
}

export const mockWorkOsResponse = (status: number, data: unknown) => ({
  data,
  status,
  headers: {},
  statusText: '',
  config: {} as WorkOsResponseConfig,
});
