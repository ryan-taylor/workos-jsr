export class NoApiKeyProvidedException extends Error {
  readonly status = 500;
  override readonly name = 'NoApiKeyProvidedException';
  override readonly message = `Missing API key. Pass it to the constructor (new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU")) ` +
    `or define it in the WORKOS_API_KEY environment variable.`;
}
