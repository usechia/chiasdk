import type { ThemeOverrides } from "../types";

export function getStyles(theme?: ThemeOverrides): string {
  const primary = theme?.primaryColor || "#2563eb";
  const radius = theme?.borderRadius || "8px";
  const font = theme?.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  return `
    :host {
      --chia-primary: ${primary};
      --chia-radius: ${radius};
      --chia-font: ${font};
      --chia-gray-50: #f9fafb; --chia-gray-100: #f3f4f6;
      --chia-gray-200: #e5e7eb; --chia-gray-300: #d1d5db;
      --chia-gray-400: #9ca3af; --chia-gray-500: #6b7280;
      --chia-gray-700: #374151; --chia-gray-900: #111827;
      --chia-green: #16a34a; --chia-red: #dc2626;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .chia-widget {
      font-family: var(--chia-font); background: #fff;
      border: 1px solid var(--chia-gray-200); border-radius: var(--chia-radius);
      padding: 24px; max-width: 420px; width: 100%;
      color: var(--chia-gray-900); font-size: 14px; line-height: 1.5;
    }
    .chia-widget h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .chia-widget h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .chia-widget p { color: var(--chia-gray-500); margin-bottom: 12px; }
    .chia-widget small { font-size: 12px; color: var(--chia-gray-400); }
    .chia-plans { display: grid; gap: 10px; }
    .chia-plan {
      border: 1px solid var(--chia-gray-200); border-radius: var(--chia-radius);
      padding: 14px 16px; cursor: pointer; background: #fff;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .chia-plan:hover {
      border-color: var(--chia-primary);
      box-shadow: 0 0 0 1px var(--chia-primary);
    }
    .chia-plan-price { font-size: 13px; color: var(--chia-gray-500); margin-top: 2px; }
    .chia-plan-desc { font-size: 12px; color: var(--chia-gray-400); margin-top: 4px; }
    .chia-summary {
      background: var(--chia-gray-50); border: 1px solid var(--chia-gray-200);
      border-radius: var(--chia-radius); padding: 12px 14px; margin-bottom: 16px;
    }
    .chia-summary-price { font-size: 13px; color: var(--chia-gray-500); }
    .chia-form { display: flex; flex-direction: column; gap: 12px; }
    .chia-label {
      font-size: 13px; font-weight: 500; color: var(--chia-gray-700);
      display: block; margin-bottom: 4px;
    }
    .chia-input, .chia-select {
      width: 100%; padding: 8px 12px; border: 1px solid var(--chia-gray-300);
      border-radius: var(--chia-radius); font-size: 14px; font-family: var(--chia-font);
      color: var(--chia-gray-900); background: #fff; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .chia-input:focus, .chia-select:focus {
      border-color: var(--chia-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--chia-primary) 20%, transparent);
    }
    .chia-input::placeholder { color: var(--chia-gray-400); }
    .chia-btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 10px 18px; border-radius: var(--chia-radius);
      font-size: 14px; font-weight: 500; font-family: var(--chia-font);
      cursor: pointer; border: 1px solid var(--chia-gray-300);
      background: #fff; color: var(--chia-gray-700);
      transition: background 0.15s, border-color 0.15s;
    }
    .chia-btn:hover { background: var(--chia-gray-50); }
    .chia-btn-primary {
      background: var(--chia-primary); color: #fff; border-color: var(--chia-primary);
    }
    .chia-btn-primary:hover { opacity: 0.9; background: var(--chia-primary); }
    .chia-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .chia-center {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 20px 0; gap: 12px;
    }
    .chia-spinner {
      width: 32px; height: 32px; border: 3px solid var(--chia-gray-200);
      border-top-color: var(--chia-primary); border-radius: 50%;
      animation: chia-spin 0.7s linear infinite;
    }
    @keyframes chia-spin { to { transform: rotate(360deg); } }
    .chia-icon-success {
      width: 40px; height: 40px; border-radius: 50%; background: var(--chia-green);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .chia-icon-success::after {
      content: ""; display: block; width: 10px; height: 16px;
      border: solid #fff; border-width: 0 2.5px 2.5px 0;
      transform: rotate(45deg) translate(-1px, -1px);
    }
    .chia-icon-error {
      width: 40px; height: 40px; border-radius: 50%; background: var(--chia-red);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; position: relative;
    }
    .chia-icon-error::before, .chia-icon-error::after {
      content: ""; position: absolute; width: 18px; height: 2.5px;
      background: #fff; border-radius: 1px;
    }
    .chia-icon-error::before { transform: rotate(45deg); }
    .chia-icon-error::after { transform: rotate(-45deg); }
    .chia-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 99999; padding: 16px;
    }
    .chia-overlay .chia-widget { position: relative; animation: chia-fade-in 0.2s ease; }
    .chia-close {
      position: absolute; top: 12px; right: 12px; background: none;
      border: none; font-size: 18px; cursor: pointer;
      color: var(--chia-gray-400); padding: 4px; line-height: 1;
    }
    .chia-close:hover { color: var(--chia-gray-700); }
    @keyframes chia-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
}
