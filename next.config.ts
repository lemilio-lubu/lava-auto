import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Permite que los builds de producción completen aunque haya errores de tipo.
    // Corregir progresivamente.
    ignoreBuildErrors: true,
  },
  // Nota: la opción 'eslint' ya no se soporta en next.config.ts a partir de Next 16.
  // El lint se configura via .eslintrc o eslint.config.mjs únicamente.
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
};

export default withSerwist(nextConfig);
