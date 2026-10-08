import { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';

/**
 * Goes back to a tab that's already in the stack, like `<Redirect>` but without stacking a copy.
 *
 * The tabs always sit under a level or the win screen. `router.replace()` to a tab (and `<Redirect>`,
 * which replaces) swapped the top screen for a *new* tabs navigator, leaving two full sets of
 * tabs mounted; each quit or MAP tap added another. `dismissTo` pops back to the existing tabs
 * and switches to the requested one.
 */
export function ReturnTo({ href }: { href: Href }) {
  const router = useRouter();
  useEffect(() => {
    router.dismissTo(href);
  }, [router, href]);
  return null;
}
