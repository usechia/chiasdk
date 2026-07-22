---
sidebar_position: 2
title: "Quick Start"
description: "Render a subscription in a few lines"
---

# Quick Start

## Wrap your app

Everything reads its publishable key and API base from `ChiaProvider`.

```tsx
import { ChiaProvider } from "@chiahq/react";
import "@chiahq/react/styles.css"; // optional default styling

function App() {
	return (
		<ChiaProvider publishableKey="pk_live_...">
			<Billing />
		</ChiaProvider>
	);
}
```

`publishableKey` is required - get one from the Chia dashboard. It is safe to ship in the browser, can be restricted to your domains, and the organization is derived from it (there is no `orgSlug`). `apiBaseUrl` defaults to `https://api.usechia.com`. Pass `fetchImpl` to supply a fetch in environments without a global one, or in tests.

`ChiaProvider` is the only provider you need. It creates its own cache internally, so there is no query client to set up and nothing to wire in alongside it.

## Show a subscription

`useSubscription` takes the subscriber id (the value in the subscribe redirect or your own record) and returns the subscriber plus its plan.

```tsx
import { useSubscription, SubscriptionManager } from "@chiahq/react";

function Billing() {
	// Drop-in component: status, plan, next billing date, pay, cancel.
	return <SubscriptionManager subscriberId="sub_123" />;
}
```

Or build your own UI from the hook:

```tsx
function Billing() {
	const { data, isLoading } = useSubscription("sub_123");
	if (isLoading || !data) return null;

	return (
		<div>
			<p>{data.plan?.name}</p>
			<p>Renews {data.subscriber.nextBillingDate}</p>
		</div>
	);
}
```

The `cancel` button only renders when the server reports `allowSelfCancel`, so you never show an action the merchant has disabled.

## Pay an outstanding balance

A past-due subscription can be paid from the browser. The charge is asynchronous - the API returns a `nextAction` telling you what the customer must do on their phone.

```tsx
import { usePayOutstanding } from "@chiahq/react";

function PayNow({ subscriberId }: { subscriberId: string }) {
	const pay = usePayOutstanding(subscriberId, {
		onNextAction: (nextAction) => {
			// e.g. show "Approve the prompt on your phone", or open a redirect URL.
			console.log(nextAction);
		},
	});

	return <button onClick={() => pay.mutate()}>Pay now</button>;
}
```

The package never opens a redirect or navigates for you - `nextAction` is yours to handle.

Next: let customers sign in and change their own plan in the [Customer Portal](./portal.md).
