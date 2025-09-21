import CryptoJS from 'crypto-js';

// Generate a unique encryption key for each chat session
export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(256/8).toString();
};

// Encrypt a message using AES encryption
export const encryptMessage = (message: string, key: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return message; // Return original message if encryption fails
  }
};

// Decrypt a message using AES decryption
export const decryptMessage = (encryptedMessage: string, key: string): string => {
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
};

// Generate a key based on user IDs for consistent encryption between two users
export const generateChatKey = (userId1: string, userId2: string): string => {
  // Sort user IDs to ensure consistent key generation regardless of order
  const sortedIds = [userId1, userId2].sort();
  const combinedString = sortedIds.join('_');
  
  // Use a simple string key that's consistent between users
  // Pad to 32 characters for AES-256
  const key = combinedString.padEnd(32, '0').substring(0, 32);
  return key;
};

// Check if a string is encrypted (basic check)
export const isEncrypted = (message: string): boolean => {
  // Check if message starts with typical AES encryption prefix
  // AES encrypted messages typically start with "U2FsdGVkX1" (Salted__ prefix)
  return message.startsWith('U2FsdGVkX1') && message.length > 20;
};
