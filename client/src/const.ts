export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Get sign-in URL - now uses embedded component route
 * This keeps users on flextab.app domain throughout authentication
 */
export const getLoginUrl = () => {
  return '/sign-in';
};

/**
 * Get sign-up URL - now uses embedded component route
 * This keeps users on flextab.app domain throughout authentication
 */
export const getSignUpUrl = () => {
  return '/sign-up';
};
