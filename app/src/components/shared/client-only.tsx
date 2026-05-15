import { useEffect, useState, type ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  /**
   * Optional placeholder rendered on the server and during the first client
   * paint, before hydration finishes. Defaults to `null` so heavy tool
   * routes ship a blank shell that is then replaced once the browser-only
   * code mounts.
   */
  fallback?: ReactNode;
}

/**
 * Render-children-only-on-the-client gate.
 *
 * Use to wrap subtrees that depend on browser-only APIs or libraries (fabric,
 * three.js, tensorflow, upscaler, react-image-crop, idb-keyval, etc.) so the
 * React Router v7 server bundle never tries to execute them. The first client
 * render still matches the server output (the `fallback`) which keeps React
 * happy at hydration; the real subtree mounts on the next tick via the
 * effect below.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <>{mounted ? children : fallback}</>;
}

export default ClientOnly;
