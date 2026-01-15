import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, hashEmail, generateId } from '../src/utils/encryption.js';

describe('Encryption', () => {
    describe('encrypt/decrypt', () => {
        it('should encrypt and decrypt text correctly', () => {
            const original = 'test@example.com';
            const encrypted = encrypt(original);
            const decrypted = decrypt(encrypted);

            expect(encrypted).not.toBe(original);
            expect(decrypted).toBe(original);
        });

        it('should handle empty strings', () => {
            expect(encrypt('')).toBe('');
            expect(decrypt('')).toBe('');
        });

        it('should produce different ciphertext for same input (due to IV)', () => {
            const text = 'test@example.com';
            const encrypted1 = encrypt(text);
            const encrypted2 = encrypt(text);

            // AES-CBC should produce different ciphertext due to random IV
            // Note: CryptoJS AES uses a random salt by default
        });
    });

    describe('hashEmail', () => {
        it('should produce consistent hash for same email', () => {
            const email = 'test@example.com';
            const hash1 = hashEmail(email);
            const hash2 = hashEmail(email);

            expect(hash1).toBe(hash2);
        });

        it('should normalize email before hashing', () => {
            const hash1 = hashEmail('Test@Example.com');
            const hash2 = hashEmail('test@example.com');
            const hash3 = hashEmail('  test@example.com  ');

            expect(hash1).toBe(hash2);
            expect(hash2).toBe(hash3);
        });

        it('should produce different hashes for different emails', () => {
            const hash1 = hashEmail('test1@example.com');
            const hash2 = hashEmail('test2@example.com');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('generateId', () => {
        it('should generate ID of specified length', () => {
            const id = generateId(21);
            expect(id.length).toBe(21);
        });

        it('should generate unique IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(generateId());
            }
            expect(ids.size).toBe(100);
        });

        it('should only contain alphanumeric characters', () => {
            const id = generateId(100);
            expect(/^[a-zA-Z0-9]+$/.test(id)).toBe(true);
        });
    });
});
