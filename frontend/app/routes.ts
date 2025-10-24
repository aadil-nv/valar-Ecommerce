import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/_dashboard._layout.tsx", [
    index("routes/_dashboard._index.tsx"),
    route("products", "routes/_dashboard.products.tsx"),
    route("orders", "routes/_dashboard.orders.tsx"),
    route("alerts", "routes/_dashboard.alerts.tsx"),
  ]),
] satisfies RouteConfig;