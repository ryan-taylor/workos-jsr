export interface VerifyOptions {
  payload: string;
  signature: string;
  secret: string;
  tolerance?: number;
}