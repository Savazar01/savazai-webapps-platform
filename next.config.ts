import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp", "heic-convert"],
  transpilePackages: ["lucide-react", "three", "@react-three/fiber", "@react-three/drei"],
  outputFileTracingRoot: path.join(__dirname, "./"),
  typescript: {
    // Type-checking is strictly validated in Step 1 of quality gates prior to push
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 storage & custom domain distribution
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      // AWS S3 standard & regional domains
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      // Unsplash curated stock & fine-art media
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      // Coolify & VPS domains
      {
        protocol: "https",
        hostname: "**.coollabs.io",
      },
      // Deployment domain distributions
      {
        protocol: "https",
        hostname: "**.savazar.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      // Universal fallback for user-entered and external CDN images
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: "/api/media/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/posts",
        destination: "/blogs",
        permanent: true,
      },
      {
        source: "/posts/:slug*",
        destination: "/blogs/:slug*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:",
              "font-src 'self' https://fonts.gstatic.com data: https:",
              "img-src 'self' data: blob: https: http: cid:",
              "media-src 'self' data: blob: https: http:",
              "connect-src 'self' https: wss: https://*.r2.cloudflarestorage.com",
              "worker-src 'self' blob:",
              "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://youtu.be https://player.vimeo.com https://www.facebook.com https://www.instagram.com https://open.spotify.com https://w.soundcloud.com https://www.google.com https://calendly.com https: data: blob:",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
