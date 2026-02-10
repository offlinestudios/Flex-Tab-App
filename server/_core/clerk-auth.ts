import { clerkClient, getAuth } from '@clerk/express';
import type { Request, Response } from 'express';
import type { User } from '../../drizzle/schema';

/**
 * Extract user from Clerk session using getAuth()
 * This function checks for Clerk session in the request
 */
export async function getUserFromClerkToken(req: Request): Promise<User | null> {
  try {
    // Get auth from Clerk middleware
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      return null;
    }

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(auth.userId);

    if (!clerkUser) {
      return null;
    }

    // Map Clerk user to our User type
    const user: User = {
      id: 0, // Temporary ID, will be set by database
      openId: clerkUser.id,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 
            clerkUser.username || 
            'User',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      role: 'user', // Default role, can be customized based on Clerk metadata
      loginMethod: 'clerk',
      createdAt: new Date(clerkUser.createdAt),
      updatedAt: new Date(clerkUser.updatedAt),
      lastSignedIn: new Date(clerkUser.lastSignInAt || clerkUser.createdAt),
    };

    return user;
  } catch (error) {
    console.error('[Clerk Auth] Error getting user:', error);
    return null;
  }
}

/**
 * Logout handler - Clerk handles session invalidation on the client side
 * Server just needs to confirm the action
 */
export async function handleClerkLogout(req: Request, res: Response) {
  try {
    // Clerk sessions are managed on the client side
    // Server just acknowledges the logout
    return res.json({ success: true });
  } catch (error) {
    console.error('[Clerk Auth] Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
}

/**
 * Get Clerk sign-in URL
 */
export function getClerkSignInUrl(): string {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY!;
  
  // Extract the base64-encoded domain from publishable key
  // Format: pk_test_[base64_encoded_domain]
  const match = publishableKey.match(/pk_test_(.+)$/);
  if (!match) {
    throw new Error('Invalid Clerk publishable key format');
  }
  
  // Decode the base64 domain
  const base64Domain = match[1];
  const decodedDomain = Buffer.from(base64Domain, 'base64').toString('utf-8').replace('$', '');
  
  return `https://${decodedDomain}/sign-in`;
}

/**
 * Get Clerk sign-up URL
 */
export function getClerkSignUpUrl(): string {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY!;
  
  const match = publishableKey.match(/pk_test_(.+)$/);
  if (!match) {
    throw new Error('Invalid Clerk publishable key format');
  }
  
  // Decode the base64 domain
  const base64Domain = match[1];
  const decodedDomain = Buffer.from(base64Domain, 'base64').toString('utf-8').replace('$', '');
  
  return `https://${decodedDomain}/sign-up`;
}
