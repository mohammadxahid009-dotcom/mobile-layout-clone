/**
 * Holds incomplete sign-up fields only in memory while the user completes the
 * role/profile step. Passwords are intentionally never written to browser storage.
 */
export interface PendingSignupData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

let pendingSignup: PendingSignupData | null = null;

export function setPendingSignup(data: PendingSignupData): void {
  pendingSignup = data;
}

export function getPendingSignup(): PendingSignupData | null {
  return pendingSignup;
}

export function clearPendingSignup(): void {
  pendingSignup = null;
}
