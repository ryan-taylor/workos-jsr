import type { PageProps } from '$fresh/server.ts';
import VaultCryptoDemo from '../../islands/VaultCryptoDemo.tsx';

export default function VaultPage({ data }: PageProps) {
  return (
    <div class='container'>
      <h1>WorkOS Vault</h1>
      <div class='description'>
        <p>
          WorkOS Vault is a secure credential and secret management service that allows you to store and manage sensitive information. It provides a
          simple API for encrypting and decrypting data, with built-in key management.
        </p>
      </div>

      <div class='demo-section'>
        <h2>Interactive Demo</h2>
        <p>
          Try out the WorkOS Vault encryption and decryption functionality using the interactive demo below. Enter text to encrypt or decrypt and see
          the results in real-time.
        </p>
        <VaultCryptoDemo />
      </div>

      <div class='use-cases'>
        <h2>Use Cases</h2>
        <div class='use-case-grid'>
          <div class='use-case'>
            <h3>Secure Credential Storage</h3>
            <p>
              Store API keys, access tokens, and other credentials securely. Vault encrypts your data using industry-standard encryption algorithms
              and handles key management for you.
            </p>
          </div>
          <div class='use-case'>
            <h3>Secrets Management</h3>
            <p>
              Manage sensitive configuration values and secrets across your application. Vault provides a centralized solution for storing and
              retrieving sensitive data with fine-grained access controls.
            </p>
          </div>
          <div class='use-case'>
            <h3>Data Protection</h3>
            <p>
              Protect user data and personally identifiable information (PII) with end-to-end encryption. Vault ensures that sensitive data is never
              stored in plaintext.
            </p>
          </div>
          <div class='use-case'>
            <h3>Compliance Requirements</h3>
            <p>
              Meet regulatory requirements for data protection like GDPR and HIPAA. Vault helps you implement security best practices and maintain
              compliance with data protection regulations.
            </p>
          </div>
        </div>
      </div>

      <div class='code-examples'>
        <h2>Code Examples</h2>
        <div class='code-example'>
          <h3>Encrypting Data</h3>
          <pre class='code'>
            {`// Initialize WorkOS
const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Define encryption context (used for key derivation)
const context = { application: "my-app", environment: "production" };

// Encrypt data
const encryptedData = await workos.vault.encrypt(
  "sensitive information to encrypt",
  context
);

console.log("Encrypted data:", encryptedData);`}
          </pre>
        </div>

        <div class='code-example'>
          <h3>Decrypting Data</h3>
          <pre class='code'>
            {`// Initialize WorkOS
const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Decrypt data
const decryptedData = await workos.vault.decrypt(encryptedData);

console.log("Decrypted data:", decryptedData);`}
          </pre>
        </div>

        <div class='code-example'>
          <h3>Creating and Managing Vault Objects</h3>
          <pre class='code'>
            {`// Create a vault object
const object = await workos.vault.createObject({
  name: "api-key",
  value: "sk_test_123456789",
  description: "Production API key"
});

// List all vault objects
const objects = await workos.vault.listObjects();

// Read a specific object
const apiKey = await workos.vault.readObject({
  id: object.id
});

// Update an object
await workos.vault.updateObject({
  id: object.id,
  value: "sk_test_updated_key"
});

// Delete an object
await workos.vault.deleteObject({
  id: object.id
});`}
          </pre>
        </div>
      </div>

      <style>
        {`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        h1 {
          font-size: 2.5rem;
          margin-bottom: 20px;
          color: #111827;
        }
        
        h2 {
          font-size: 1.8rem;
          margin: 40px 0 20px;
          color: #111827;
        }
        
        h3 {
          font-size: 1.3rem;
          margin: 20px 0 10px;
          color: #111827;
        }
        
        .description {
          font-size: 1.1rem;
          line-height: 1.5;
          margin-bottom: 30px;
          color: #4b5563;
        }
        
        .demo-section {
          margin: 40px 0;
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .use-cases {
          margin: 40px 0;
        }
        
        .use-case-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .use-case {
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .use-case p {
          color: #4b5563;
          line-height: 1.5;
        }
        
        .code-examples {
          margin: 40px 0;
        }
        
        .code-example {
          margin-bottom: 30px;
        }
        
        .code {
          display: block;
          padding: 20px;
          background-color: #1e293b;
          color: #e2e8f0;
          border-radius: 8px;
          overflow-x: auto;
          font-family: monospace;
          line-height: 1.5;
          white-space: pre;
        }
        
        @media (max-width: 768px) {
          .use-case-grid {
            grid-template-columns: 1fr;
          }
          
          h1 {
            font-size: 2rem;
          }
          
          h2 {
            font-size: 1.5rem;
          }
        }
        `}
      </style>
    </div>
  );
}
