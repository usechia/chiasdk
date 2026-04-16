# Widget Live Demos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed interactive live widget demos in the docs so readers can see the widget in action without leaving the page.

**Architecture:** A `<WidgetDemo />` React component loads the `@chiahq/widget` script at runtime, initializes it in a container div, and cleans up on unmount. The publishable key comes from `docusaurus.config.ts` `customFields`. The component is embedded in MDX doc pages via import.

**Tech Stack:** React, Docusaurus MDX, @chiahq/widget (CDN), CSS Modules

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/WidgetDemo.tsx` | React component that loads widget script and manages lifecycle |
| Create | `src/components/WidgetDemo.module.css` | Wrapper styling for demo containers |
| Modify | `docusaurus.config.ts` | Add `customFields.widgetDemoKey` |
| Modify | `docs/widget/quick-start.md` | Add one live demo after the complete HTML example |
| Modify | `docs/widget/examples.md` | Add live demos after inline, modal, and themed code snippets |

---

### Task 1: Add publishable key to docusaurus config

**Files:**
- Modify: `docusaurus.config.ts:17-20`

- [ ] **Step 1: Add customFields to config**

Insert `customFields` block after the `onBrokenLinks` line in `docusaurus.config.ts`:

```typescript
  onBrokenLinks: 'throw',

  customFields: {
    widgetDemoKey: process.env.WIDGET_DEMO_KEY || '',
  },

  i18n: {
```

- [ ] **Step 2: Verify build still passes**

Run: `cd /Volumes/Work/code/chia/open/docs && pnpm build`
Expected: `[SUCCESS] Generated static files in "build".`

- [ ] **Step 3: Commit**

```bash
git add docusaurus.config.ts
git commit -m "feat(docs): add widgetDemoKey custom field for live demos"
```

---

### Task 2: Create WidgetDemo component

**Files:**
- Create: `src/components/WidgetDemo.tsx`
- Create: `src/components/WidgetDemo.module.css`

- [ ] **Step 1: Create the CSS module**

Create `src/components/WidgetDemo.module.css`:

```css
.demoWrapper {
  margin: 24px 0;
  border: 1px solid var(--ifm-color-emphasis-200);
  border-radius: 8px;
  overflow: hidden;
}

.demoLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--ifm-color-emphasis-500);
  padding: 8px 16px;
  border-bottom: 1px solid var(--ifm-color-emphasis-200);
  background: var(--ifm-color-emphasis-100);
}

.demoContainer {
  background: #ffffff;
  padding: 16px;
  min-height: 200px;
}

.demoFallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--ifm-color-emphasis-500);
  font-size: 13px;
}

.modalTrigger {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  background: var(--ifm-color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  margin-bottom: 12px;
}

.modalTrigger:hover {
  opacity: 0.9;
}
```

- [ ] **Step 2: Create the React component**

Create `src/components/WidgetDemo.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./WidgetDemo.module.css";

interface WidgetDemoProps {
  planId?: string;
  planSlug?: string;
  theme?: { primaryColor?: string; borderRadius?: string; fontFamily?: string };
  modal?: boolean;
  prefill?: { phone?: string; name?: string };
}

let scriptPromise: Promise<void> | null = null;

function loadWidgetScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window !== "undefined" && (window as any).Chia) {
    return Promise.resolve();
  }
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load widget script"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

let demoCounter = 0;

export default function WidgetDemo({
  planId,
  planSlug,
  theme,
  modal,
  prefill,
}: WidgetDemoProps) {
  const { siteConfig } = useDocusaurusContext();
  const publishableKey = siteConfig.customFields?.widgetDemoKey as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [id] = useState(() => `usechia-demo-${++demoCounter}`);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!publishableKey || !containerRef.current) {
      setError("Demo unavailable - set WIDGET_DEMO_KEY to enable live demos.");
      return;
    }

    let destroyed = false;

    loadWidgetScript()
      .then(() => {
        if (destroyed || !containerRef.current) return;
        const Chia = (window as any).Chia;
        if (!Chia) {
          setError("Failed to load widget script.");
          return;
        }

        widgetRef.current = Chia.init({
          publishableKey,
          container: containerRef.current,
          ...(planId && { planId }),
          ...(planSlug && { planSlug }),
          ...(theme && { theme }),
          ...(prefill && { prefill }),
          onReady: () => setReady(true),
          onError: () => {},
        });
      })
      .catch(() => {
        if (!destroyed) {
          setError("Failed to load widget - try the code snippet above to run it locally.");
        }
      });

    return () => {
      destroyed = true;
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
    };
  }, [publishableKey, planId, planSlug]);

  if (error) {
    return (
      <div className={styles.demoWrapper}>
        <div className={styles.demoLabel}>Live demo</div>
        <div className={styles.demoFallback}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.demoWrapper}>
      <div className={styles.demoLabel}>Live demo</div>
      {modal && ready && (
        <div style={{ padding: "16px 16px 0" }}>
          <button
            className={styles.modalTrigger}
            onClick={() => widgetRef.current?.open()}
          >
            Open modal
          </button>
        </div>
      )}
      <div className={styles.demoContainer} ref={containerRef} id={id} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build passes (SSR check)**

Run: `cd /Volumes/Work/code/chia/open/docs && pnpm build`
Expected: `[SUCCESS] Generated static files in "build".`

The component only touches `window`/`document` inside `useEffect`, so SSR should pass. If it fails with a `window is not defined` error, wrap the export with `BrowserOnly` from `@docusaurus/BrowserOnly`.

- [ ] **Step 4: Commit**

```bash
git add src/components/WidgetDemo.tsx src/components/WidgetDemo.module.css
git commit -m "feat(docs): add WidgetDemo component for live widget demos"
```

---

### Task 3: Add live demo to quick-start page

**Files:**
- Modify: `docs/widget/quick-start.md:95-112`

- [ ] **Step 1: Add import and demo to quick-start**

At the very top of `docs/widget/quick-start.md` (after the frontmatter closing `---`), add the MDX import:

```mdx
import WidgetDemo from '@site/src/components/WidgetDemo';
```

Then after the closing ` ``` ` of the "Complete HTML example" code block (after line 95), add:

```mdx

<WidgetDemo />
```

- [ ] **Step 2: Verify it renders locally**

Run: `cd /Volumes/Work/code/chia/open/docs && WIDGET_DEMO_KEY=pk_test_your_key pnpm start`

Open `http://localhost:3000/docs/widget/quick-start`. Scroll to "Complete HTML example" - the live demo should appear below the code block.

Without a valid key, you'll see: "Demo unavailable - set WIDGET_DEMO_KEY to enable live demos."

- [ ] **Step 3: Verify build passes**

Run: `cd /Volumes/Work/code/chia/open/docs && pnpm build`
Expected: `[SUCCESS] Generated static files in "build".`

- [ ] **Step 4: Commit**

```bash
git add docs/widget/quick-start.md
git commit -m "feat(docs): add live widget demo to quick-start page"
```

---

### Task 4: Add live demos to examples page

**Files:**
- Modify: `docs/widget/examples.md`

- [ ] **Step 1: Add import and demos to examples page**

At the very top of `docs/widget/examples.md` (after the frontmatter closing `---`), add the MDX import:

```mdx
import WidgetDemo from '@site/src/components/WidgetDemo';
```

Then add `<WidgetDemo />` calls after these code blocks:

**After "CDN - inline on a static site" code block (after line 27):**

```mdx

<WidgetDemo />
```

**After "CDN - modal with a trigger button" code block (after line 49):**

```mdx

<WidgetDemo modal />
```

**After "Custom theming" code block (after line 111):**

```mdx

<WidgetDemo theme={{ primaryColor: "#059669", borderRadius: "16px", fontFamily: "'DM Sans', sans-serif" }} />
```

**After "Pre-filling subscriber data" code block (after line 95):**

```mdx

<WidgetDemo prefill={{ phone: "+265000000001", name: "Jane Doe" }} />
```

- [ ] **Step 2: Verify it renders locally**

Run: `cd /Volumes/Work/code/chia/open/docs && WIDGET_DEMO_KEY=pk_test_your_key pnpm start`

Open `http://localhost:3000/docs/widget/examples`. Verify:
- Inline demo appears after the first code block
- Modal demo shows an "Open modal" button
- Themed demo renders with green (#059669) primary color
- Prefill demo shows pre-populated phone and name fields

- [ ] **Step 3: Verify build passes**

Run: `cd /Volumes/Work/code/chia/open/docs && pnpm build`
Expected: `[SUCCESS] Generated static files in "build".`

- [ ] **Step 4: Commit**

```bash
git add docs/widget/examples.md
git commit -m "feat(docs): add live widget demos to examples page"
```

---

### Task 5: Create demo organization and set key

**Files:**
- None (manual setup in dashboard + env config)

- [ ] **Step 1: Create local sandbox demo org**

Start the platform locally (`pnpm dev:core` from `/Volumes/Work/code/chia/platform`). Sign up or use an existing account. Create an organization named "Chia Demo". Create 3 plans:
- "Basic" - MWK 1,000 / monthly
- "Pro" - MWK 5,000 / monthly
- "Enterprise" - MWK 25,000 / monthly

Go to Settings > API Keys, create a publishable key (type: publishable, environment: sandbox). Copy the `pk_test_...` value.

- [ ] **Step 2: Create production demo org**

Go to `usechia.com`, sign up or use an existing account. Create the same org and plans. Create a sandbox publishable key. Copy the `pk_test_...` value.

- [ ] **Step 3: Configure local dev environment**

Create or update `/Volumes/Work/code/chia/open/docs/.env` (Docusaurus loads `.env` automatically):

```bash
WIDGET_DEMO_KEY=pk_test_local_key_here
```

Add `.env` to `.gitignore` if not already there.

- [ ] **Step 4: Test the full flow locally**

Run: `cd /Volumes/Work/code/chia/open/docs && pnpm start`

Open `http://localhost:3000/docs/widget/quick-start`. The live demo should:
1. Show a loading spinner
2. Load and display the 3 plans (Basic, Pro, Enterprise)
3. Allow selecting a plan
4. Show the phone form
5. Accept test number `+265000000001` and show processing then success

- [ ] **Step 5: Document the production key for deployment**

Note the production `pk_test_...` key. This will be set as `WIDGET_DEMO_KEY` in the deployment environment (Cloudflare Workers, Vercel, or wherever the docs are hosted). Check `wrangler.toml` if using Cloudflare:

```toml
[vars]
WIDGET_DEMO_KEY = "pk_test_production_key_here"
```

---

## Verification Checklist

- [ ] `pnpm build` passes with no SSR errors
- [ ] Live demos render on quick-start and examples pages
- [ ] Widget loads plans from sandbox API
- [ ] Modal demo's "Open modal" button opens the overlay
- [ ] Themed demo renders with custom green color
- [ ] Prefill demo populates phone and name fields
- [ ] Navigating away from the page cleans up (no console errors about destroyed components)
- [ ] Without `WIDGET_DEMO_KEY` set, demos show fallback message instead of crashing
