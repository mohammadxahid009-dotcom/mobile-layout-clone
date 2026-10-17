// Login/sign-up removed: the app opens directly. These helpers stay so pages keep working.
export type AppUserRole = "customer" | "provider";

export interface StoredAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: AppUserRole;
  providerId: string;
  username?: string;
  age?: string | number;
  gender?: string;
}

export function getStoredUser(): StoredAuthUser | null {
  return null;
}

export async function logOutUser(): Promise<void> {}
