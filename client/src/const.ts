export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Get Clerk sign-in URL
 * Extracts the Clerk domain from the publishable key and constructs the sign-in URL
 */
export const getLoginUrl = () => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('VITE_CLERK_PUBLISHABLE_KEY is not set');
    return '/sign-in';
  }
  
  // Extract base64-encoded domain from publishable key (format: pk_test_[base64])
  const match = publishableKey.match(/pk_test_(.+)$/);
  
  if (!match) {
    console.error('Invalid Clerk publishable key format');
    return '/sign-in';
  }
  
  // Decode the base64 domain
  const base64Domain = match[1];
  const decodedDomain = atob(base64Domain).replace('$', '');
  const redirectUrl = encodeURIComponent(`${window.location.origin}/app`);
  
  return `https://${decodedDomain}/sign-in?redirect_url=${redirectUrl}`;
};

/**
 * Get Clerk sign-up URL
 */
export const getSignUpUrl = () => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('VITE_CLERK_PUBLISHABLE_KEY is not set');
    return '/sign-up';
  }
  
  const match = publishableKey.match(/pk_test_(.+)$/);
  
  if (!match) {
    console.error('Invalid Clerk publishable key format');
    return '/sign-up';
  }
  
  // Decode the base64 domain
  const base64Domain = match[1];
  const decodedDomain = atob(base64Domain).replace('$', '');
  const redirectUrl = encodeURIComponent(`${window.location.origin}/app`);
  
  return `https://${decodedDomain}/sign-up?redirect_url=${redirectUrl}`;
};
