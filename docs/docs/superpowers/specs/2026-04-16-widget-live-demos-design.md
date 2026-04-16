# Live Widget Demos in Docs

## Problem

The widget documentation shows code snippets but readers cannot see the widget in action without copying code and running it themselves. Live demos on the docs pages let visitors interact with the widget immediately.

## Design

### WidgetDemo component

A React component at `src/components/WidgetDemo.tsx` that loads the `@chiahq/widget` script, initializes it in a container, and cleans up on unmount.

**Props:**

```typescript
interface WidgetDemoProps {
  planId?: string;
  planSlug?: string;
  theme?: { primaryColor?: string; borderRadius?: string; fontFamily?: string };
  modal?: boolean;       // if true, renders an "Open modal" button instead of inline
  prefill?: { phone?: string; name?: string };
  height?: string;       // default "420px"
}
```

**Lifecycle:**

1. `useEffect` on mount: check if `window.Chia` exists. If not, inject a `<script>` tag for the widget bundle and wait for it to load.
2. Call `Chia.init()` with the publishable key from `useDocusaurusContext().siteConfig.customFields.widgetDemoKey`, the container ref, and the passed props.
3. If `modal` prop is true, don't init immediately - render a button that calls `widget.open()` on click.
4. Return cleanup function that calls `widget.destroy()`.

**Wrapper styling:**

The component renders a wrapper div with:
- A "Live demo" label (small, uppercase, muted) at the top
- A bordered container with light background (`#fff`) and border-radius
- Respects dark mode by keeping the inner area white (widget renders on white)

### Publishable key configuration

Add to `docusaurus.config.ts`:

```typescript
customFields: {
  widgetDemoKey: process.env.WIDGET_DEMO_KEY || "pk_test_default_demo_key",
},
```

- **Local dev**: Set `WIDGET_DEMO_KEY` to a `pk_test_` key from a local sandbox org
- **Production build**: Set `WIDGET_DEMO_KEY` to a `pk_test_` key from a production sandbox org (sandbox keys are safe to expose - they can only read public plans and create test intents)

### Demo org setup

Create a demo organization with:
- Name: "Chia Demo"
- 2-3 sample plans: "Basic" (MWK 1,000/monthly), "Pro" (MWK 5,000/monthly), "Enterprise" (MWK 25,000/monthly)
- One locally (for dev against localhost:3001) and one on production usechia.com

### Where demos appear

**`docs/widget/quick-start.md`:**
- After the "Complete HTML example" code block, add one `<WidgetDemo />` showing the full plan selector flow

**`docs/widget/examples.md`:**
- After "CDN - inline on a static site" code: `<WidgetDemo planId="basic-plan-id" />`
- After "CDN - modal with a trigger button" code: `<WidgetDemo modal />`
- After "Custom theming" code: `<WidgetDemo theme={{ primaryColor: "#059669", borderRadius: "16px" }} />`
- After "Pre-filling subscriber data" code: `<WidgetDemo prefill={{ phone: "+265000000001", name: "Jane Doe" }} />`

### Script loading strategy

The widget bundle is loaded from the npm CDN (`https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js`). The component manages a module-level promise so the script is loaded once and shared across all `<WidgetDemo />` instances on a page.

```typescript
let scriptPromise: Promise<void> | null = null;

function loadWidgetScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window !== "undefined" && (window as any).Chia) {
    return Promise.resolve();
  }
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load widget script"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}
```

### File changes

**Create:**
- `src/components/WidgetDemo.tsx` - the component
- `src/components/WidgetDemo.module.css` - wrapper styles

**Modify:**
- `docusaurus.config.ts` - add `customFields.widgetDemoKey`
- `docs/widget/quick-start.md` - add one live demo
- `docs/widget/examples.md` - add live demos after code snippets

### SSR safety

Docusaurus pre-renders pages. The component must:
- Guard all `window`/`document` access behind `typeof window !== "undefined"`
- Use `useEffect` (not constructor logic) for all DOM manipulation
- The script tag injection and `Chia.init()` only run client-side

### Error handling

If the widget fails to load (network error, invalid key), the component shows a fallback message: "Demo unavailable - try the code snippet above to run it locally."

## Verification

1. `pnpm build` passes (no SSR errors from the component)
2. `pnpm start` shows live widget demos on quick-start and examples pages
3. Widget loads, shows plans, and accepts test phone numbers in sandbox
4. Modal demo shows "Open modal" button, clicking it opens the widget overlay
5. Themed demo renders with the custom primary color
6. Navigating away from the page cleans up (no orphaned polling timers)
