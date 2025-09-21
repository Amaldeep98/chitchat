import CryptoJS from 'crypto-js';

// Simple encryption utility for chat messages
export class ChatEncryption {
  private static readonly KEY_PREFIX = 'chitchat_';
  
  // Generate a consistent encryption key for a chat between two users
  static generateChatKey(userId1: string, userId2: string): string {
    // Sort user IDs to ensure consistent key generation
    const sortedIds = [userId1, userId2].sort();
    const combinedString = sortedIds.join('_');
    
    // Create a deterministic key from the user IDs
    const hash = CryptoJS.SHA256(combinedString).toString();
    return this.KEY_PREFIX + hash.substring(0, 32);
  }
  
  // Encrypt a message
  static encrypt(message: string, key: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(message, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return message; // Return original if encryption fails
    }
  }
  
  // Decrypt a message
  static decrypt(encryptedMessage: string, key: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      // If decryption fails, return the original encrypted message
      if (!decryptedString) {
        console.warn('Decryption failed, returning encrypted message');
        return encryptedMessage;
      }
      
      return decryptedString;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedMessage; // Return encrypted message if decryption fails
    }
  }
  
  // Check if a string looks like an encrypted message
  static isEncrypted(message: string): boolean {
    // AES encrypted messages typically start with "U2FsdGVkX1" (Salted__ prefix)
    return message.startsWith('U2FsdGVkX1') && message.length > 20;
  }
  
  // Test encryption/decryption with a given key
  static testEncryption(key: string): boolean {
    const testMessage = "Hello World";
    const encrypted = this.encrypt(testMessage, key);
    const decrypted = this.decrypt(encrypted, key);
    return testMessage === decrypted;
  }
}

