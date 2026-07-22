# @chiahq/react: remove the TanStack Query dependency

## Goal

Ship `@chiahq/react` with `react` as its only peer dependency. Today every hook wraps
`useQuery`/`useMutation`, so merchants must install `@tanstack/react-query` themselves,
which is a hard install failure under pnpm.

## Why not the alternatives

Bundling React Query into `dist` works (the existing host-client fallback degrades to
isolation rather than crashing) but measures 15,393 B gzipped against 5,161 B for the
current external build: 3x the payload for the same merchant-facing outcome, and it keeps
React Query types in the public API permanently.

Doing this now is close to free. Published versions are `0.0.2` and `0.1.0`, and the npm
downloads API has no record for the package. Once `UseQueryResult` is load-bearing in
merchant code, removing it becomes a major-version break.

## Consumed surface

Verified against every call site in `src/components` and `test/`.

Queries (`usePlans`, `useSubscription`, `usePortalSubscriptions`) use only `data`,
`isLoading`, `error`, plus the `enabled` and `refetchInterval` options. No call site uses
`refetch`, `status`, `isFetching`, or query-level `isError`/`isSuccess`.

Mutations (`useCancelSubscription`, `useChangePlan`, `usePayOutstanding`, `useRequestOtp`,
`useVerifyOtp`) use `data`, `isPending`, `isError`, `isSuccess`, `error`, `variables`, and
`mutate(vars, { onSuccess })` with per-call callbacks.

Mirroring these field names exactly means all four components compile untouched.

## Design

A single store, scoped per provider (`useState(() => createStore())` inside `ChiaProvider`,
passed on context). Per-provider rather than module-global so it keys correctly to
`publishableKey`/`apiBaseUrl`, isolates two providers on one page, and tears down with the
tree in tests.

A shared store is required, not a convenience: `useChangePlan` lives in `PlanChange` and
invalidates the subscription query that lives in `SubscriptionManager`, so invalidation
crosses component boundaries.

Contents: a `Map` from serialized key to entry, a subscriber set per key,
`useSyncExternalStore` for reads, `invalidate(key)`, an `AbortController` per in-flight
fetch, and an interval driver for polling.

## Phases

1. Store and primitives in `src/internal/store.ts` and `src/internal/hooks.ts`
   (`useStoreQuery`, `useStoreMutation`). Standalone and unit-tested first.
2. Rewrite `provider.tsx`: delete `useHostQueryClient`, `fallbackClient`, the
   `QueryClientProvider` wrap, and the biome-ignore. Add the store to `ChiaContextValue`.
3. Port the 8 React Query hooks. `use-portal-session.ts` never used it and stays as is.
4. Drop `@tanstack/react-query` from `tsup.config.ts` `external`, from `peerDependencies`
   and `devDependencies`, and update the README install line.
5. Delete `describe("host QueryClient")` in `test/subscription.test.tsx` and its import.
   The remaining tests use only the `ChiaProvider` wrapper and are the regression net.

## API delta

Keep and reimplement: `data`, `error`, `isLoading`, `isPending`, `isError`, `isSuccess`,
`variables`, `mutate`. Add `refetch` and `mutateAsync`.

Drop: `status`, `isFetching`, `reset`, `failureCount`, `dataUpdatedAt`, `isStale`.

## Risks

- **Disabled-query `isLoading`.** React Query v5 reports `isLoading: false` for a disabled
  query. `usePortalSubscriptions` is disabled without a session token and `PlanList`/
  `SubscriptionManager` gate spinners on `isLoading`. Getting this backwards renders a
  permanent spinner instead of the signed-out state. Needs an explicit test.
- **`useSyncExternalStore` snapshot caching.** Snapshots must be cached per key and
  replaced only on real state change, or React throws "getSnapshot should be cached".
- **Dropping `retry: 1`.** The current fallback client sets it (`provider.tsx:80`). Not
  reimplementing it is a behavior change: a flaky first request that used to recover will
  now surface an error. Decision, not omission.
- Polling must not stack a request while one is in flight.
- The store must survive StrictMode double-effects in dev.

## Verification

`pnpm test` green, `pnpm typecheck`, `pnpm lint`, then rebuild and measure gzipped size
against the 5,161 B baseline.

## Outcome

All five phases shipped. 43 tests pass (22 new for the store and primitives, 21 existing),
typecheck and lint clean, build clean. The four components needed zero changes.

Verified by hiding `node_modules/@tanstack/react-query` and re-running: the full suite and
the build both pass with the package physically absent. `dist/index.js`, `dist/index.cjs`
and `dist/index.d.ts` contain zero references to it, so the type leak is closed.

Measured cost, esbuild minified with react external: **5,673 B gzipped, up from 5,161 B**.
The internal store cost 512 B. Bundling React Query would have cost 10,232 B, so this came
in 20x cheaper.

Decisions as resolved:

- `mutateAsync` is implemented. The existing portal tests use it in five places, so it was
  a real requirement rather than a speculative one.
- `refetch` is still not implemented. No call site needs it.
- `retry: 1` was dropped and not replaced. A request that fails once now surfaces the error
  instead of silently recovering.
- `fetchStatus` is gone. The one test asserting it now asserts `isLoading === false` plus a
  zero-length call log, which is the same intent in the new vocabulary.
- `QueryResult`, `MutationResult` and `MutateCallbacks` are exported from the package root
  so consumers can name hook return types, as they previously could with React Query's.

Two defects were caught by the red phases, both of which would have shipped:

- Keeping the fetcher in the effect deps aborts the in-flight request on every render, so
  queries never settle. Fixed by holding it in a ref.
- Polling faster than the response arrives starves the query for the same reason. Fixed
  with `store.isFetching(key)` guarding the interval tick.

Still untested: StrictMode double-effects.

## Post-verify fixes

A verification pass found three problems outside the package plus one defect inside it.

- `pnpm-lock.yaml` still pinned `@tanstack/react-query` for `packages/react` while
  `release-react.yml` runs `pnpm install --frozen-lockfile`, so the release job would have
  failed. Regenerated; `--frozen-lockfile` now passes.
- The docs site still told merchants to install the peer dependency and described the
  deleted `QueryClientProvider` fallback. Fixed in `docs/docs/react/overview.md`,
  `docs/docs/react/quick-start.md`, and a whole stale section of the package README that
  the first sweep missed.
- Host callback exceptions were swallowed by `mutate`'s `.catch(() => {})`. A throwing
  `onSuccess` reported `isSuccess: true` with no error and no trace. Now each callback runs
  through `runCallback`: one throwing no longer skips the next, mutation state stays
  truthful, and the error is reported via `console.error` rather than discarded.
- `useChangePlan` and `usePayOutstanding` called the host `onNextAction` before
  invalidating, so a throwing callback left the cache stale. Invalidation now runs first.

On the reporting channel: rethrowing asynchronously was tried first and does reach the
runtime's uncaught handler, but an async throw is uncatchable and polluted the test run.
It would do the same in a merchant's suite, so it reports instead of rethrows. This is the
one deliberate `console.error` in `src/`.

Coverage added for the gaps the verify pass found: query failures at both the hook level
and through `SubscriptionManager`, including the `renderError` path. 50 tests total.

Still untested after this pass: StrictMode double-effects, and there is still no abort on
unmount, so an in-flight request outlives the component that started it.

## Second verify pass

Three more issues, all fixed.

- **The ordering fix was untested.** Every `onNextAction` in the suite was a `vi.fn()` that
  never throws, so nothing defended the fix above. Added an integration test pairing
  `useSubscription` with `useChangePlan` and a throwing `onNextAction`, asserting the
  subscription refetches anyway. Confirmed it has teeth by reverting the ordering: the test
  fails with "expected 1 to be greater than 1", meaning no refetch ever happened.
- **The store had become public API.** `ChiaContextValue.store` put every store method on
  the supported surface via `useChia()`, and `Store` is `ReturnType<typeof createStore>`, so
  internal edits would silently reshape an exported type. Moved to a separate
  `ChiaStoreContext` that is not re-exported. `ChiaContextValue` is back to what it was
  before this work, and the public `.d.ts` no longer mentions `Store`, `QueryState` or
  `Fetcher`.
- **A throwing subscriber could wedge a key permanently.** The first `write` in `runFetch`
  sat outside the `try`, so a listener throwing left `inflight` populated, `isFetching(key)`
  true forever, and every poll tick skipped. `write` now isolates each listener, so one
  throwing neither aborts the notify loop nor escapes into `runFetch`. Two tests cover it.

Error reporting for host-owned code is now centralised in `src/internal/report.ts`, used by
both the mutation callback path and the store's notify loop. That is the only `console.*`
in `src/`.

Final: 53 tests, gzipped 5,795 B against the 5,161 B baseline.

## Third verify pass

Reading the complete source diff, and checking the README against measured behavior rather
than intent, found one real regression and two untested claims.

- **No request deduplication.** `useStoreQuery`'s mount effect called `store.fetch`
  unconditionally and `runFetch` aborted whatever was in flight, so N components sharing a
  key produced N requests with N-1 aborted. Measured: three components, three requests.
  React Query collapsed these into one. `runFetch` now takes a `force` flag: a plain call
  joins an in-flight request for the same key, and only `invalidate` forces a superseding
  fetch, since that is the one case where the cached value is known stale.
- **The README claimed deduplication that did not exist**, written in the previous pass from
  intent rather than behavior. Now true and defended by a component test asserting one
  request for three `SubscriptionManager`s. The caching section also states plainly what the
  store does not do: no retry, no cancel-on-unmount, no refetch-on-focus.
- **Two documented guarantees and three error paths had no tests.** Added: two providers
  keeping separate caches, and the outside-provider throws for `useChia`, `useChiaStore` and
  a data hook.

Superseding is now reachable only through `invalidate`, so the old supersede test was
rewritten against the forced path rather than deleted.

Final: 60 tests, gzipped 5,853 B against the 5,161 B baseline.

## Verify-and-fix rounds

- `signOut` now clears the subscriber-scoped cache keys (`chia-portal-subscriptions`,
  `chia-subscription`) via a new `store.clear(prefix)`, leaving `chia-plans` cached because
  the plan catalogue is public and a signed-out portal should still render it. `clear` aborts
  in-flight requests for the cleared key, so a response landing after sign-out cannot
  repopulate what was just removed.
- The polling `isFetching` guard was removed: deduplication makes a tick joining an in-flight
  request the same outcome, and two comments still describing the pre-deduplication contract
  were corrected. `isFetching` itself is gone, since nothing in `src` needed it afterwards.
- StrictMode is no longer an open question. A test asserts one request under the double
  mount, and disabling deduplication makes it fail with two, so the double mount is real and
  deduplication is what absorbs it.

Final: 64 tests, gzipped 5,925 B against the 5,161 B baseline.
