import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/png", href: "/logo.png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
  },
];

export function meta() {
  return [
    { charset: "utf-8" },
    { title: "Chia - Unified African Payment Integration" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "description", content: "A unified SDK and MCP server for seamless integration with African payment providers. Support for PayChangu, PawaPay, and more." },
    { name: "keywords", content: "african payments, mobile money, paychangu, pawapay, payment sdk, mcp server, ai payments, fintech, africa" },
    { property: "og:title", content: "Chia - Unified African Payment Integration" },
    { property: "og:description", content: "A unified SDK and MCP server for seamless integration with African payment providers." },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/logo.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Chia - Unified African Payment Integration" },
    { name: "twitter:description", content: "A unified SDK and MCP server for seamless integration with African payment providers." },
    { name: "twitter:image", content: "/logo.png" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
