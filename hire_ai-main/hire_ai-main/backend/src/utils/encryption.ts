import CryptoJS from 'crypto-js';
import { config } from '../config.js';

const ENCRYPTION_KEY = config.encryptionKey || 'dev-insecure-key-replace-in-production';

/**
 * Encrypt sensitive data (emails, PII) using AES-256
 */
export function encrypt(text: string): string {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt sensitive data
 */
export function decrypt(ciphertext: string): string {
    if (!ciphertext) return '';
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Create a hash of an email for indexing/lookup
 * This allows checking for duplicates without storing plaintext
 */
export function hashEmail(email: string): string {
    const normalized = email.toLowerCase().trim();
    return CryptoJS.SHA256(normalized).toString();
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 21): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}
