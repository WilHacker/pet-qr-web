import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // El dominio oficial de Cloudinary
      },
    ],
  },
};

export default nextConfig;