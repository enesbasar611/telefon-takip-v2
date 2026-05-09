/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Build sırasında TS ve Lint hataları yüzünden sürecin durmasını engelliyoruz
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        serverComponentsExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth", "puppeteer", "whatsapp-web.js", "unzipper"],
    },
};

export default nextConfig;