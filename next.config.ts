import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["xlsx"],
  // Identity/reference forms can contain credentials and personal identifiers.
  logging: {
    serverFunctions: false,
    incomingRequests: {
      ignore: [
        /^\/(?:user-management|group-user|hak-akses-menu|profile)(?:\/|\?|$)/,
      ],
    },
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
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
