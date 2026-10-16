/**
 * MFC Youth Area Management System - Biometrics Authentication Wrapper
 * Provides fast, hardware-backed biometric authentication (Touch ID, Face ID,
 * Android Fingerprint, Windows Hello) for returning servant leaders.
 */

import { secureStorage } from './secureStorage';

const BIOMETRIC_CRED_KEY = 'mfc_biometric_credential';
const BIOMETRIC_SESSION_KEY = 'mfc_biometric_session';

export const biometrics = {
  /**
   * Check if the device hardware supports biometric verification
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      if (typeof window === 'undefined') return false;

      // Check for WebAuthn platform authenticator (Windows Hello, Touch ID, Face ID, Android Biometrics)
      if (
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return Boolean(available);
      }

      return false;
    } catch (err) {
      console.warn('[Biometrics] Availability check notice:', err);
      return false;
    }
  },

  /**
   * Check if the user has enrolled their biometrics on this device
   * @returns {Promise<boolean>}
   */
  async isEnrolled() {
    const cred = await secureStorage.getItem(BIOMETRIC_CRED_KEY);
    const session = await secureStorage.getItem(BIOMETRIC_SESSION_KEY);
    return Boolean(cred && session);
  },

  /**
   * Enroll current active session with device biometrics
   * @param {Object} session Active auth session to bind to biometrics
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  async enroll(session) {
    if (!session || !session.email) {
      return { ok: false, error: 'Valid session required for biometric enrollment.' };
    }

    try {
      const isAvail = await this.isAvailable();
      if (!isAvail) {
        return { ok: false, error: 'Biometric hardware is not available on this device.' };
      }

      const challenge = new Uint8Array(32);
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(challenge);
      }

      const userId = new TextEncoder().encode(session.email);

      // Create WebAuthn platform credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'MFC Youth Area Management System', id: window.location.hostname || 'localhost' },
          user: {
            id: userId,
            name: session.email,
            displayName: session.name || session.email
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          timeout: 60000
        }
      });

      if (!credential) {
        return { ok: false, error: 'Biometric registration was cancelled.' };
      }

      // Store enrolled credential metadata and session
      await secureStorage.setItem(BIOMETRIC_CRED_KEY, JSON.stringify({
        id: credential.id,
        email: session.email,
        enrolledAt: new Date().toISOString()
      }));

      await secureStorage.setItem(BIOMETRIC_SESSION_KEY, JSON.stringify(session));

      return { ok: true };
    } catch (err) {
      console.warn('[Biometrics] Enrollment error:', err);
      // Fallback for environments without full WebAuthn challenge setup
      if (err.name === 'NotAllowedError') {
        return { ok: false, error: 'Biometric verification was cancelled or timed out.' };
      }
      return { ok: false, error: err.message || 'Failed to enroll biometrics.' };
    }
  },

  /**
   * Trigger device biometric prompt to unlock returning session
   * @returns {Promise<{ ok: boolean, session?: Object, error?: string }>}
   */
  async verify() {
    try {
      const isEnrolled = await this.isEnrolled();
      if (!isEnrolled) {
        return { ok: false, error: 'No biometric credentials enrolled on this device.' };
      }

      const rawCred = await secureStorage.getItem(BIOMETRIC_CRED_KEY);
      const rawSession = await secureStorage.getItem(BIOMETRIC_SESSION_KEY);

      if (!rawCred || !rawSession) {
        return { ok: false, error: 'Stored biometric session not found.' };
      }

      const credMeta = JSON.parse(rawCred);
      const session = JSON.parse(rawSession);

      const challenge = new Uint8Array(32);
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(challenge);
      }

      // Trigger native biometric prompt (Face ID, Touch ID, Windows Hello, Fingerprint)
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname || 'localhost',
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (!assertion) {
        return { ok: false, error: 'Biometric unlock cancelled.' };
      }

      return { ok: true, session };
    } catch (err) {
      console.warn('[Biometrics] Verification error:', err);
      if (err.name === 'NotAllowedError') {
        return { ok: false, error: 'Biometric prompt was dismissed.' };
      }
      return { ok: false, error: err.message || 'Biometric authentication failed.' };
    }
  },

  /**
   * Remove biometric credentials from this device
   */
  async disable() {
    await secureStorage.removeItem(BIOMETRIC_CRED_KEY);
    await secureStorage.removeItem(BIOMETRIC_SESSION_KEY);
  }
};
