import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const route = vi.hoisted(() => ({ path: '/reset-password' }));
vi.mock('wouter', () => ({ useLocation: () => [route.path, vi.fn()] }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {} } }));
vi.mock('@/lib/trpc', () => ({ trpc: { useUtils: () => ({ client: {} }) } }));
vi.mock('./NativeAuth', () => ({ authRedirectUrl: () => '' }));
import { AppleSignInSetup } from './AppleSignInSetup';

function render() {
  return renderToStaticMarkup(createElement(AppleSignInSetup, {
    children: createElement('form', { 'aria-label': 'Choose a new password' }),
  }));
}

describe('Apple setup recovery access', () => {
  it('renders the recovery route before Apple setup completes', () => {
    route.path = '/reset-password';
    expect(render()).toContain('Choose a new password');
  });
  it('does not bypass setup for the dashboard', () => {
    route.path = '/dashboard';
    const html = render();
    expect(html).not.toContain('Choose a new password');
    expect(html).toContain('Loading FlexTab');
  });
});
