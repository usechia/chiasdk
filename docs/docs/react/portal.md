---
sidebar_position: 3
title: "Customer Portal"
description: "Email sign-in and self-service plan changes"
---

# Customer Portal

The portal lets a subscriber sign in with their email and manage their own subscriptions - including upgrading or downgrading - without the merchant handling a secret key.

## How sign-in works

A subscriber enters their email, receives a one-time code, and exchanges it for a session token. The token is stored for you (in `localStorage`, keyed per org) and attached automatically to portal requests.

The request-code step always returns the same response whether or not the email has a subscription, so the endpoint cannot be used to discover who is a customer.

```tsx
import { PortalLogin, usePortalSubscriptions } from "@chiahq/react";

function Portal() {
	return <PortalLogin onAuthenticated={() => console.log("signed in")} />;
}
```

`PortalLogin` handles the two steps (email, then code) and surfaces distinct messages for a wrong code versus too many attempts.

To drive it yourself:

```tsx
import { useRequestOtp, useVerifyOtp, usePortalSession } from "@chiahq/react";

function CustomLogin() {
	const requestOtp = useRequestOtp();
	const verifyOtp = useVerifyOtp(); // stores the session token on success
	const { isAuthenticated, signOut } = usePortalSession();

	// requestOtp.mutate({ email });  then  verifyOtp.mutate({ email, code });
}
```

## List the signed-in customer's subscriptions

Once authenticated, `usePortalSubscriptions` returns every subscription attached to that email. It is disabled until there is a session, and attaches the token for you.

```tsx
function MySubscriptions() {
	const { data } = usePortalSubscriptions();
	return (
		<ul>
			{data?.subscriptions.map((s) => (
				<li key={s.subscriber.id}>{s.plan?.name}</li>
			))}
		</ul>
	);
}
```

## Change plan

`useChangePlan` moves a subscriber to another plan. The direction is decided by amount:

- **Upgrade** (moving to a more expensive plan) applies **immediately** and triggers a mobile-money charge, returned as a `nextAction`.
- **Downgrade** applies **at the end of the current period** - no charge now. The subscription reports the queued change on `pendingPlanId` and `planChangeAt` until it takes effect.

Whether a given move is allowed at all is the plan's decision (`allowUpgrade` / `allowDowngrade`); a disallowed move comes back as a plain error.

```tsx
import { useChangePlan, PlanChange } from "@chiahq/react";

// Drop-in: renders the available moves, proration, pending change, next action.
function ChangeMyPlan({ subscriber, plans }) {
	return <PlanChange subscriber={subscriber} plans={plans} currentPlanId={subscriber.planId} />;
}

// Or the hook directly:
function UpgradeButton({ subscriberId, planId }) {
	const change = useChangePlan(subscriberId, {
		onNextAction: (nextAction) => {
			// upgrade charge - prompt the customer to approve on their phone
		},
	});
	return <button onClick={() => change.mutate({ planId })}>Upgrade</button>;
}
```

Pass `timing` explicitly (`"immediate"` or `"at_period_end"`) to override the default for a direction.

## A note on the merchant flag

The three subscription actions (view, cancel, pay) and change-plan accept either a portal session or, if the merchant has not enabled portal authentication, the older link-based flow. When `require_portal_auth` is on for the organization, a valid session is required. Build against the session flow; it is the durable one.
