module.exports = {
    port: process.env.PORT || 5000,
    coingeckoApiKey: process.env.COINGECKO_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'https://your-frontend-url.netlify.app'
    ]
}; 