import { crypto } from "jsr:@std/crypto@^1";
import { encodeUInt32 } from "../common/utils/leb128.ts";

/**
 * Encrypts plaintext data using AES-GCM and a given data key.
 *
 * @param data - The plaintext string to encrypt
 * @param dataKey - Base64-encoded data key for encryption
 * @param encryptedKeys - Base64-encoded encrypted data keys to include
 * @param aad - Associated additional data for AEAD
 * @returns Promise resolving to a base64-encoded encrypted payload
 */
export const encrypt = async (
  data: string,
  dataKey: string,
  encryptedKeys: string,
  aad: string,
): Promise<string> => {
  // encrypt using the returned data key
  const key = base64ToUint8Array(dataKey);
  const keyBlob = base64ToUint8Array(encryptedKeys);
  const prefixLen = encodeUInt32(keyBlob.length);
  const iv = crypto.getRandomValues(new Uint8Array(32));

  // Use Deno's Web Crypto API
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const aadBytes = encoder.encode(aad);

  // Use AES-GCM for authenticated encryption
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: aadBytes,
    },
    cryptoKey,
    dataBytes,
  );

  const ciphertext = new Uint8Array(encryptedData);

  // In AES-GCM, the tag is appended to the ciphertext
  // Extract the last 16 bytes (128 bits) as the tag
  const tagSize = 16;
  const tag = ciphertext.slice(ciphertext.length - tagSize);
  const actualCiphertext = ciphertext.slice(0, ciphertext.length - tagSize);

  // store the encrypted keys with the ciphertext
  const payload = concatUint8Arrays([
    iv,
    tag,
    prefixLen,
    keyBlob,
    actualCiphertext,
  ]);

  return uint8ArrayToBase64(payload);
};

// Helper functions to replace Buffer methods
function base64ToUint8Array(base64: string): Uint8Array {
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return btoa(binString);
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}
