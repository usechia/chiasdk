import React, { useMemo, useState } from "react";
import styles from "./DepositPlayground.module.css";

const defaultValues = {
  paychanguSecretKey: "your_paychangu_secret_key",
  paychanguReturnUrl: "https://your-return-url.com",
  paychanguEnvironment: "DEVELOPMENT",
  pawapayJwt: "your_pawapay_jwt_token",
  pawapayEnvironment: "DEVELOPMENT",
  nodeEnv: "development",
};

export default function DepositPlayground(): React.JSX.Element {
  const [values, setValues] = useState(defaultValues);
  const [copied, setCopied] = useState(false);

  const envSnippet = useMemo(() => {
    return [
      "# PayChangu Configuration",
      `PAYCHANGU_SECRET_KEY=${values.paychanguSecretKey}`,
      `PAYCHANGU_RETURN_URL=${values.paychanguReturnUrl}`,
      `PAYCHANGU_ENVIRONMENT=${values.paychanguEnvironment}`,
      "",
      "# PawaPay Configuration",
      `PAWAPAY_JWT=${values.pawapayJwt}`,
      `PAWAPAY_ENVIRONMENT=${values.pawapayEnvironment}`,
      "",
      "# General Configuration",
      `NODE_ENV=${values.nodeEnv}`,
    ].join("\n");
  }, [values]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(envSnippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      setCopied(false);
    }
  };

  const updateValue = (key: keyof typeof defaultValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((prev) => ({
        ...prev,
        [key]: event.target.value,
      }));
    };

  const reset = () => {
    setValues(defaultValues);
    setCopied(false);
  };

  return (
    <section className={styles.playground}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Deposit Playground</p>
          <h3 className={styles.title}>Tune your credentials, preview your .env</h3>
          <p className={styles.subtitle}>
            Update the fields below to generate a ready-to-use environment file for SDK testing.
            Nothing here is sent anywhere — it stays in your browser.
          </p>
        </div>
        <span className={styles.badge}>Local only</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>PayChangu</span>
              <span className={styles.groupHint}>Deposit flows</span>
            </div>

            <label className={styles.label} htmlFor="paychangu-secret">
              Secret key
            </label>
            <input
              id="paychangu-secret"
              className={styles.input}
              value={values.paychanguSecretKey}
              onChange={updateValue("paychanguSecretKey")}
              placeholder="PAYCHANGU_SECRET_KEY"
            />

            <label className={styles.label} htmlFor="paychangu-return">
              Return URL
            </label>
            <input
              id="paychangu-return"
              className={styles.input}
              value={values.paychanguReturnUrl}
              onChange={updateValue("paychanguReturnUrl")}
              placeholder="https://your-return-url.com"
            />

            <label className={styles.label} htmlFor="paychangu-env">
              Environment
            </label>
            <select
              id="paychangu-env"
              className={styles.select}
              value={values.paychanguEnvironment}
              onChange={updateValue("paychanguEnvironment")}
            >
              <option value="DEVELOPMENT">DEVELOPMENT</option>
              <option value="PRODUCTION">PRODUCTION</option>
            </select>
          </div>

          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>PawaPay</span>
              <span className={styles.groupHint}>Deposit orchestration</span>
            </div>

            <label className={styles.label} htmlFor="pawapay-jwt">
              JWT token
            </label>
            <input
              id="pawapay-jwt"
              className={styles.input}
              value={values.pawapayJwt}
              onChange={updateValue("pawapayJwt")}
              placeholder="PAWAPAY_JWT"
            />

            <label className={styles.label} htmlFor="pawapay-env">
              Environment
            </label>
            <select
              id="pawapay-env"
              className={styles.select}
              value={values.pawapayEnvironment}
              onChange={updateValue("pawapayEnvironment")}
            >
              <option value="DEVELOPMENT">DEVELOPMENT</option>
              <option value="PRODUCTION">PRODUCTION</option>
            </select>
          </div>

          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>General</span>
              <span className={styles.groupHint}>Local runtime</span>
            </div>

            <label className={styles.label} htmlFor="node-env">
              NODE_ENV
            </label>
            <select
              id="node-env"
              className={styles.select}
              value={values.nodeEnv}
              onChange={updateValue("nodeEnv")}
            >
              <option value="development">development</option>
              <option value="production">production</option>
            </select>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryButton} type="button" onClick={handleCopy}>
              {copied ? "Copied" : "Copy .env"}
            </button>
            <button className={styles.ghostButton} type="button" onClick={reset}>
              Reset
            </button>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>Env preview</span>
            <span className={styles.previewHint}>Save as `.env` in your test app</span>
          </div>
          <pre className={styles.codeBlock}>
            <code>{envSnippet}</code>
          </pre>
          <p className={styles.footerNote}>
            Avoid sharing production secrets in screenshots or public repos. This widget only formats values
            locally for testing.
          </p>
        </div>
      </div>
    </section>
  );
}
