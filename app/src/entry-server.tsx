import type { ReactElement } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'node:stream';
import { StaticRouter } from 'react-router-dom';
import {
  HelmetProvider,
  type HelmetDataContext,
  type HelmetServerState,
} from '@dr.pogodin/react-helmet';
import { AppProviders } from './AppProviders';
import AppRoutes from './Routes';
import type { InitialData } from './ssr/InitialDataContext';

export { matchSeoRoute, seoRoutes } from './ssr/loaders';
export type {
  Loader,
  LoaderContext,
  LoaderResult,
  RouteDef,
} from './ssr/loaders';

export interface RenderResult {
  html: string;
  helmet: {
    title: string;
    meta: string;
    link: string;
    script: string;
    htmlAttributes: string;
    bodyAttributes: string;
  };
}

export interface RenderOptions {
  url: string;
  initialData?: InitialData;
}

const EMPTY_HELMET: RenderResult['helmet'] = {
  title: '',
  meta: '',
  link: '',
  script: '',
  htmlAttributes: '',
  bodyAttributes: '',
};

function extractHelmet(ctx: HelmetDataContext): RenderResult['helmet'] {
  const state: HelmetServerState | undefined = ctx.helmet;
  if (!state) return EMPTY_HELMET;
  return {
    title: state.title?.toString() ?? '',
    meta: state.meta?.toString() ?? '',
    link: state.link?.toString() ?? '',
    script: state.script?.toString() ?? '',
    htmlAttributes: state.htmlAttributes?.toString() ?? '',
    bodyAttributes: state.bodyAttributes?.toString() ?? '',
  };
}

/**
 * Render the React tree to a string, waiting for all Suspense boundaries
 * (including `React.lazy` imports) to resolve before emitting HTML.
 *
 * We need `renderToPipeableStream` with `onAllReady` for this; the older
 * `renderToString` would emit Suspense fallbacks for any component that
 * hasn't loaded yet, which in this app is every route-level page.
 */
function renderToStringAsync(tree: ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;

    const writable = new Writable({
      write(chunk: Buffer | string, _encoding, callback) {
        chunks.push(
          typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk
        );
        callback();
      },
    });

    writable.on('finish', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    writable.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });

    const stream = renderToPipeableStream(tree, {
      onAllReady() {
        stream.pipe(writable);
      },
      onShellError(err) {
        if (settled) return;
        settled = true;
        reject(err instanceof Error ? err : new Error(String(err)));
      },
      onError(err) {
        // eslint-disable-next-line no-console
        console.error('[SSR render]', err);
      },
    });
  });
}

export async function render({
  url,
  initialData,
}: RenderOptions): Promise<RenderResult> {
  const helmetContext: HelmetDataContext = {};

  const html = await renderToStringAsync(
    <HelmetProvider context={helmetContext}>
      <AppProviders initialData={initialData}>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </AppProviders>
    </HelmetProvider>
  );

  return {
    html,
    helmet: extractHelmet(helmetContext),
  };
}
