/**
 * LEB128 (Little Endian Base 128) encoding and decoding functions for unsigned 32-bit integers.
 * This is a simple implementation that replaces the external 'leb' package.
 */

/**
 * Encodes an unsigned 32-bit integer using LEB128 encoding.
 *
 * @param value The unsigned 32-bit integer to encode
 * @returns A Uint8Array containing the LEB128 encoded bytes
 */
export function encodeUInt32(value: number): Uint8Array {
  if (value < 0 || value > 0xFFFFFFFF || !Number.isInteger(value)) {
    throw new Error("Value must be an unsigned 32-bit integer");
  }

  // For zero, return a single byte
  if (value === 0) {
    return new Uint8Array([0]);
  }

  const bytes: number[] = [];

  // Encode the value using LEB128
  while (value !== 0) {
    // Take the 7 least significant bits
    let byte = value & 0x7F;
    value >>>= 7; // Unsigned right shift by 7 bits

    // If there are more bytes to follow, set the high bit
    if (value !== 0) {
      byte |= 0x80;
    }

    bytes.push(byte);
  }

  return new Uint8Array(bytes);
}

/**
 * Decodes an unsigned 32-bit integer from LEB128 encoding.
 *
 * @param bytes The Uint8Array containing the LEB128 encoded bytes
 * @param startIndex The index to start decoding from (default: 0)
 * @returns An object containing the decoded value and the index of the next byte after the decoded value
 */
export function decodeUInt32(
  bytes: Uint8Array,
  startIndex = 0,
): { value: number; nextIndex: number } {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error("Input must be a Uint8Array");
  }

  if (startIndex < 0 || startIndex >= bytes.length) {
    throw new Error("Invalid start index");
  }

  let value = 0;
  let shift = 0;
  let index = startIndex;
  let byte;

  do {
    if (index >= bytes.length) {
      throw new Error("Unexpected end of input");
    }

    // Read the next byte
    byte = bytes[index++];

    // Add the 7 least significant bits to the result
    value |= (byte & 0x7F) << shift;

    // Increase the shift for the next byte
    shift += 7;

    // Check for potential overflow
    if (shift > 35) { // 5 bytes is more than enough for a 32-bit integer
      throw new Error("Integer overflow");
    }
  } while (byte & 0x80); // Continue if the high bit is set

  return { value, nextIndex: index };
}
