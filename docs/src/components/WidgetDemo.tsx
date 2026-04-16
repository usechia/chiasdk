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
