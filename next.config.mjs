/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "p-crm-5f24c.firebasestorage.app" },
    ],
  },
  typescript: {
    // Do not fail production builds on type *warnings*.
    // (Real errors still fail; this is mainly to avoid blocking on non-critical TS noise.)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
