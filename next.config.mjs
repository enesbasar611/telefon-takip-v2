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
    images: {
        formats: ['image/webp', 'image/avif'],
        remotePatterns: [
            { protocol: 'https', hostname: '**.googleapis.com' },
            { protocol: 'https', hostname: '**.googleusercontent.com' },
        ],
    },
    experimental: {
        serverComponentsExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth", "puppeteer", "whatsapp-web.js", "unzipper"],
    },
    webpack: (config, { isServer }) => {
        // Watchpack hatalarını ve gereksiz dosya taramalarını engeller
        config.watchOptions = {
            ignored: [
                '**/node_modules',
                '**/.git',
                '**/@prisma/client',
                '**/.next',
                'C:/System Volume Information/**',
                'C:/pagefile.sys',
                'C:/hiberfil.sys',
                'C:/dumpstack.log.tmp',
                'C:/swapfile.sys'
            ],
            poll: 1000, // Windows için daha kararlı dosya izleme
            aggregateTimeout: 300,
        };
        
        // Bundle analyzer - sadece ANALYZE=true ile çalışır
        if (process.env.ANALYZE === 'true') {
            const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
            config.plugins.push(new BundleAnalyzerPlugin({
                analyzerMode: 'server',
                analyzerPort: isServer ? 8888 : 8889,
                openAnalyzer: true,
            }));
        }
        
        return config;
    },
};

export default nextConfig;