import { describe, it, expect, beforeEach, vi } from "vitest";
import { encryptToken, decryptToken } from "./encryptionService";

describe("encryptionService", () => {
  beforeEach(() => {
    // Ensure consistent environment for testing
    process.env.JWT_SECRET = "test-secret-key-for-encryption-testing";
  });

  describe("encryptToken", () => {
    it("should encrypt a token and return a base64 string", () => {
      const plaintext = "my-secret-token-12345";
      const encrypted = encryptToken(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      // Base64 strings should only contain alphanumeric, +, /, and =
      expect(/^[A-Za-z0-9+/=]+$/.test(encrypted)).toBe(true);
    });

    it("should produce different ciphertexts for the same plaintext (due to random IV)", () => {
      const plaintext = "same-token";
      const encrypted1 = encryptToken(plaintext);
      const encrypted2 = encryptToken(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe("decryptToken", () => {
    it("should decrypt an encrypted token back to the original plaintext", () => {
      const plaintext = "my-secret-token-12345";
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle various token formats", () => {
      const tokens = [
        "github_token_abc123",
        "huggingface_hf_xyz789",
        "vercel_token_with_special_chars_!@#$%",
        "very-long-token-" + "x".repeat(500),
      ];

      tokens.forEach(token => {
        const encrypted = encryptToken(token);
        const decrypted = decryptToken(encrypted);
        expect(decrypted).toBe(token);
      });
    });

    it("should throw an error when decrypting invalid data", () => {
      const invalidBase64 = "not-a-valid-encrypted-token";

      expect(() => {
        decryptToken(invalidBase64);
      }).toThrow("Failed to decrypt token");
    });

    it("should throw an error when decrypting corrupted data", () => {
      const plaintext = "my-secret-token";
      const encrypted = encryptToken(plaintext);

      // Corrupt the base64 string by removing characters
      const corrupted = encrypted.slice(0, -10);

      expect(() => {
        decryptToken(corrupted);
      }).toThrow("Failed to decrypt token");
    });
  });

  describe("round-trip encryption/decryption", () => {
    it("should maintain data integrity through multiple encrypt/decrypt cycles", () => {
      const original = "test-token-for-round-trip";

      let current = original;
      for (let i = 0; i < 5; i++) {
        const encrypted = encryptToken(current);
        current = decryptToken(encrypted);
      }

      expect(current).toBe(original);
    });
  });
});
