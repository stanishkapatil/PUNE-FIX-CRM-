/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "p-crm-5f24c.firebasestorage.app",
    ],
  },
  typescript: {
    // Do not fail production builds on type *warnings*.
    // (Real errors still fail; this is mainly to avoid blocking on non-critical TS noise.)
    ignoreBuildErrors: false,
  },
  eslint: {
    // Do not fail production builds on ESLint warnings.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
