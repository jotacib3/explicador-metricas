import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // oculta el botón flotante de Next en dev (estorba al grabar)
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
