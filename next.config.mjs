/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.externals = [...config.externals, { canvas: 'canvas' }]; // required to make Konva & react-konva work
        return config;
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "d1ntgpbz8fwreu.cloudfront.net",
            }
        ]
    },
    output: "standalone"
};

export default nextConfig;
