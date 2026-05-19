import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Permite imágenes de cualquier HTTPS temporalmente
      },
    ],
  },
};

export default nextConfig;