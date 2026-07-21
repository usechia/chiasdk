# @chiahq/react

React hooks and components for customer-facing Chia subscription management.

Drop this into your own app to let subscribers see their subscription, pay an outstanding
balance over mobile money, and cancel when you allow it. No dashboard, no iframe, no
redirect hijacking.

## Install

```bash
npm install @chiahq/react
```

`react` and `@tanstack/react-query` are peer dependencies. The package ships no HTTP
client and no toast library: it talks to the public storefront API with `fetch` and
returns errors to you.

## Quick start

```tsx
import { ChiaProvider, SubscriptionManager } from "@chiahq/react";
import "@chiahq/react/styles.css"; // optional

export function BillingPage({ subscriberId }: { subscriberId: string }) {
	return (
		<ChiaProvider orgSlug="acme">
			<SubscriptionManager
				subscriberId={subscriberId}
				onNextAction={(nextAction) => {
					// You own navigation. Chia never calls window.location for you.
					if (nextAction.type === "redirect" && nextAction.redirectUrl) {
						router.push(nextAction.redirectUrl);
					}
				}}
			/>
		</ChiaProvider>
	);
}
```

`apiBaseUrl` defaults to `https://api.usechia.com`. Point it elsewhere for local work:

```tsx
<ChiaProvider orgSlug="acme" apiBaseUrl="http://localhost:3001">
```

## Works with your existing QueryClient

If your app already renders a `QueryClientProvider`, `ChiaProvider` detects it and uses
your client. Your cache, your retry policy, your devtools. Only when no host client is
found does it create a private fallback. It never replaces a client you supplied.

```tsx
<QueryClientProvider client={myClient}>
	<ChiaProvider orgSlug="acme">
		<App />
	</ChiaProvider>
</QueryClientProvider>
```

## Hooks

Use these directly if you want your own markup.

```tsx
import { usePlans, useSubscription, useCancelSubscription, usePayOutstanding } from "@chiahq/react";

function Billing({ subscriberId }: { subscriberId: string }) {
	const pay = usePayOutstanding(subscriberId, {
		onNextAction: (action) => setPrompt(action.message),
	});

	// Poll only while a payment is settling. TanStack Query handles the timer.
	const settling = pay.data?.paymentStatus === "processing";
	const { data } = useSubscription(subscriberId, { refetchInterval: settling ? 3000 : false });

	const cancel = useCancelSubscription(subscriberId);

	if (!data) return null;

	return (
		<>
			<p>{data.plan?.name}</p>
			<p>{data.subscriber.status}</p>
			{data.subscriber.status === "past_due" && (
				<button onClick={() => pay.mutate()} disabled={pay.isPending}>
					Pay now
				</button>
			)}
			{data.allowSelfCancel && <button onClick={() => cancel.mutate()}>Cancel</button>}
		</>
	);
}
```

| Hook | Endpoint |
| --- | --- |
| `usePlans()` | `GET /s/:orgSlug/plans` |
| `useSubscription(subscriberId, options?)` | `GET /s/:orgSlug/subscription/:subscriberId` |
| `useCancelSubscription(subscriberId)` | `POST /s/:orgSlug/subscription/:subscriberId/cancel` |
| `usePayOutstanding(subscriberId, options?)` | `POST /s/:orgSlug/subscription/:subscriberId/pay` |

Mutations invalidate `["chia-subscription", orgSlug, subscriberId]` on success.

## Cancellation is server-gated

`useSubscription` returns `allowSelfCancel` from the organization's settings.
`SubscriptionManager` renders no cancel affordance when it is `false`, and the API
returns `403` regardless, so a hand-rolled UI cannot bypass it. Check the flag before
rendering your own cancel button.

Cancellation sets `cancelAtPeriodEnd` -- the subscription stays active until the current
period ends.

## nextAction is surfaced, never acted on

`POST .../pay` returns a `nextAction` describing what the customer must do:
`redirect`, `tan_prompt`, `ussd_prompt`, `pin_prompt`, `wait_for_webhook`, or `none`.

This package hands it to you and stops. It does not call `window.location.href`, does
not open windows, and does not swallow `redirectUrl`. `SubscriptionManager` renders a
plain link for redirect actions and calls `onNextAction` for everything else; your app
decides whether that means a router push, a modal, or a full navigation.

## Money is never a number

Amounts arrive as decimal strings from `numeric(12,2)` and stay strings all the way to
the DOM. `formatAmount` groups digits with string operations only -- no `parseFloat`, no
precision loss. Do the same in your own components: never parse an amount to a float for
storage or comparison.

## Styling

Components ship with semantic markup and `chia-*` class names, unstyled by default. Two
ways to theme:

1. Import the optional stylesheet: `import "@chiahq/react/styles.css"`.
2. Style the class names yourself, or override the CSS custom properties the stylesheet
   reads. Every property has a fallback, so setting none of them still looks reasonable.

```css
:root {
	--chia-accent: #1d4ed8;
	--chia-text: #17191c;
	--chia-text-muted: #878e96;
	--chia-radius: 0.5rem;
}
```

`usableBrand()` is exported for brand-color work: it returns ink instead of the brand
when the brand is too light for white text to be readable on it.

## Subscription statuses

`incomplete`, `awaiting_customer_action`, `trialing`, `active`, `renewal_pending`,
`paused`, `cancelled`, `past_due`.

## Not yet available

The following are being built and are deliberately absent from this release. Their API
contracts are not final, so nothing here should be treated as forthcoming in a specific
shape:

- **Plan changes** -- there is no `useChangePlan`. The change-plan endpoint is still in
  development.
- **Customer portal** -- there is no `usePortalSession` or hosted portal component.

Both will land in a later minor version once their endpoints stabilize. Do not build
against a guessed shape in the meantime.

## License

MIT
