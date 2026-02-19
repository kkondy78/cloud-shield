/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Required for Cloudflare Pages - no image optimization server
        unoptimized: true,
    },
};

export default nextConfig;
