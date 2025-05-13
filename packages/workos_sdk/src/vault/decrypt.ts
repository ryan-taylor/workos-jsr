import { crypto } from "jsr:@std/crypto@1";
import { decodeUInt32 } from "workos/common/utils/leb128.ts";

/**
 * Decoded structure for encrypted payloads.
 */
export interface Decoded {
  iv: Uint8Array;
  tag: Uint8Array;
  keys: string;
  ciphertext: Uint8Array;
}

/**
 * Decrypts an encrypted payload or Decoded object using AES-GCM.
 * 
 * @param payload - Base64 string or Decoded payload object
 * @param dataKey - Base64-encoded data key for decryption
 * @param aad - Associated additional data for AEAD
 * @returns Promise resolving to the decrypted plaintext string
 */
export const decrypt = async (
  payload: string | Decoded,
  dataKey: string,
  aad: string,
): Promise<string> => {
  if (typeof payload === "string") {
    payload = decode(payload);
  }
  const { iv, tag, ciphertext } = payload;
  const key = base64ToUint8Array(dataKey);

  // Use Deno's Web Crypto API
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const aadBytes = encoder.encode(aad);

  // For AES-GCM, the tag is combined with the ciphertext
  // We need to recreate a full ciphertext with the tag appended
  const fullCiphertext = concatUint8Arrays([ciphertext, tag]);

  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  // Decrypt the data
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: aadBytes,
    },
    cryptoKey,
    fullCiphertext,
  );

  // Convert the decrypted data to a string
  return decoder.decode(decryptedData);
};

/**
 * Decodes a base64-encoded encrypted payload into its components.
 * 
 * @param payload - Base64-encoded string containing IV, tag, key length, keys, and ciphertext
 * @returns Decoded object with iv, tag, keys, and ciphertext
 */
export const decode = (payload: string): Decoded => {
  const inputData = base64ToUint8Array(payload);
  const iv = inputData.slice(0, 32);
  const tag = inputData.slice(32, 48);
  const { value: keyLen, nextIndex } = decodeUInt32(inputData, 48);
  const keysBytes = inputData.slice(nextIndex, nextIndex + keyLen);
  const keys = uint8ArrayToBase64(keysBytes);
  const ciphertext = inputData.slice(nextIndex + keyLen);
  return {
    iv,
    tag,
    keys,
    ciphertext,
  };
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
