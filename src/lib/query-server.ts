import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/**
 * A QueryClient scoped to a single server request, for prefetching data in a
 * server component and handing it to the client already populated.
 *
 * `cache()` makes this per-request rather than per-process: a module-level
 * client would leak one user's prefetched data into another user's render,
 * which on a per-user app like this one is a data-leak bug, not a perf note.
 *
 * Pair with `<HydrationBoundary state={dehydrate(qc)}>` around the client
 * component. The client's own useQuery then finds the data already in cache
 * and renders it on first paint instead of mounting, fetching, and showing a
 * skeleton — removing a full browser->Worker->database round trip that the
 * server had already made.
 *
 * Prefetch failures are deliberately not fatal: prefetchQuery swallows the
 * error, the page still renders, and the client refetches with the retry
 * behaviour configured in lib/providers.tsx. A stalled database should cost a
 * skeleton, not the page.
 */
export const getServerQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          // Long enough that the client doesn't immediately refetch what the
          // server just handed it.
          staleTime: 60_000,
        },
      },
    })
);
