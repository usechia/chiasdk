import { usePluginData } from "@docusaurus/useGlobalData";

type PackageKey = "sdk" | "mcp" | "widget";

export default function Version({ pkg }: { pkg: PackageKey }) {
  const versions = usePluginData("package-versions") as Record<PackageKey, string>;
  const version = versions?.[pkg] ?? "0.0.0";
  return <span className="version-badge">v{version}</span>;
}
