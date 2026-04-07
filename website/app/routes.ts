import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("docs", "routes/docs.tsx"),
  route("sdk", "routes/sdk.tsx"),
  route("mcp", "routes/mcp.tsx"),
] satisfies RouteConfig;
