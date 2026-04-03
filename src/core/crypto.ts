// src/core/crypto.ts
// Machine-specific AES-256-GCM encryption for sensitive data

import * as crypto from 'crypto';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const KEY_DIR = path.join(os.homedir(), '.localcode');
const KEY_FILE = path.join(KEY_DIR, '.key');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Generate a machine-specific encryption key.
 * Uses hostname + MAC addresses + a salt to create a deterministic key.
 * This means data encrypted on one machine cannot be decrypted on another,
 * which is the desired security property for local credentials.
 */
function getMachineKey(): Buffer {
  // Check for existing key file
  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE);
  }

  // Generate a new key from machine identifiers
  const hostname = os.hostname();
  const networkInterfaces = os.networkInterfaces();
  const macAddresses: string[] = [];

  for (const [_name, ifaces] of Object.entries(networkInterfaces)) {
    if (!ifaces) continue;
    for (const iface of ifaces) {
      if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
        macAddresses.push(iface.mac);
      }
    }
  }

  // Create deterministic key from machine identifiers
  const machineString = `${hostname}:${macAddresses.sort().join(':')}:${os.platform()}:${os.arch()}`;
  const key = crypto.scryptSync(machineString, 'localcode-key-derivation', 32);

  // Save key to file for future use
  try {
    if (!fs.existsSync(KEY_DIR)) {
      fs.mkdirSync(KEY_DIR, { recursive: true });
    }
    fs.writeFileSync(KEY_FILE, key, { mode: 0o600 }); // Owner read/write only
  } catch {
    // If we can't save the key, we'll regenerate it each time
    // This is less secure but still better than plaintext
  }

  return key;
}

/**
 * Encrypt data using AES-256-GCM.
 * Returns a base64-encoded string containing: salt + iv + tag + ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getMachineKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derive a per-encryption key from the machine key + salt
  const derivedKey = crypto.scryptSync(key, salt, 32);

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: salt:iv:tag:ciphertext (all base64)
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':');
}

/**
 * Decrypt data that was encrypted with encrypt().
 * Returns the original plaintext string.
 */
export function decrypt(encryptedData: string): string {
  const key = getMachineKey();
  const parts = encryptedData.split(':');

  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [saltB64, ivB64, tagB64, ciphertext] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');

  // Derive the same per-encryption key
  const derivedKey = crypto.scryptSync(key, salt, 32);

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a string looks like it's encrypted (base64 format with 4 parts).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 4) return false;
  // Check if each part looks like base64
  return parts.every(part => /^[A-Za-z0-9+/=]+$/.test(part));
}

/**
 * Encrypt an object's sensitive fields.
 * By default, encrypts fields named: apiKey, secret, password, token
 */
export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[] = ['apiKey', 'secret', 'password', 'token'] as unknown as (keyof T)[],
): T {
  const result = { ...obj };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      result[field] = encrypt(value) as unknown as T[keyof T];
    }
  }
  return result;
}

/**
 * Decrypt an object's sensitive fields.
 */
export function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[] = ['apiKey', 'secret', 'password', 'token'] as unknown as (keyof T)[],
): T {
  const result = { ...obj };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && isEncrypted(value)) {
      try {
        result[field] = decrypt(value) as unknown as T[keyof T];
      } catch {
        // If decryption fails, leave the encrypted value as-is
        // This handles the case where the key was regenerated
      }
    }
  }
  return result;
}
