const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-frontend-url.netlify.app",
    "http://localhost:3000",
    "https://joljv-6aaaa-aaaah-qqbmq-cai.icp0.io",
  ],
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const COIN_GECKO_API_URL = "https://api.coingecko.com/api/v3";
const CMC_API_KEY = process.env.CMC_API_KEY;

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

app.get("/api/prices/:topPriorityCoinIds", async (req, res) => {
  try {
    const { topPriorityCoinIds } = req.params;
    const currency = "usd";

    try {
      // Fetch top priority coins
      const topPriorityResponse = await axios.get(
        `${COIN_GECKO_API_URL}/coins/markets`,
        {
          params: {
            vs_currency: currency,
            ids: topPriorityCoinIds,
            order: "market_cap_desc",
            per_page: 10,
            page: 1,
            sparkline: false,
            price_change_percentage: "24h",
          },
        }
      );

      // Fetch all coins
      const allCoinsResponse = await axios.get(
        `${COIN_GECKO_API_URL}/coins/markets`,
        {
          params: {
            vs_currency: currency,
            order: "market_cap_desc",
            per_page: 250,
            page: 1,
            sparkline: false,
            price_change_percentage: "24h",
          },
        }
      );

      // Filter out top priority coins from all coins
      const topPriorityData = topPriorityResponse.data || [];
      const allCoinsData = allCoinsResponse.data || [];
      const otherCoinsData = allCoinsData.filter(
        (coin) => !topPriorityCoinIds.split(",").includes(coin.id)
      );

      // Combine top priority coins and other coins
      const combinedTopMovers = [...topPriorityData, ...otherCoinsData];

      res.json(combinedTopMovers);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).json({
        error: error.message,
        details:
          "Failed to fetch coin data. Please check the CoinGecko API or your request parameters.",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
      details: "Make sure you are using the correct coins ID from CoinGecko",
    });
  }
});

app.get("/api/cmc/price/:coinIds", async (req, res) => {
  try {
    let { coinIds } = req.params;
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
      {
        headers: {
          "X-CMC_PRO_API_KEY": CMC_API_KEY,
        },
        params: {
          id: coinIds,
        },
      }
    );

    if (response.data) {
      let data = response.data.data;

      let details = Object.values(data)[0].quote.USD;
      res.json({
        price: details.price,
        price_change_24h: details.percent_change_24h,
      }); // });
    }
  } catch (e) {
    console.log(e);
  }
});

// Endpoint to fetch crypto price and market data
app.get("/api/price/:coinId", async (req, res) => {
  try {
    const { coinId } = req.params;
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}`,
      {
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false,
          sparkline: false,
          x_cg_demo_api_key: COINGECKO_API_KEY,
        },
        headers: {
          "x-cg-demo-api-key": COINGECKO_API_KEY,
        },
      }
    );

    if (response.data) {
      res.json({
        coinId: coinId,
        price: response.data.market_data.current_price.usd,
        volume_24h: response.data.market_data.total_volume.usd,
        price_change_24h: response.data.market_data.price_change_percentage_24h,
        market_cap: response.data.market_data.market_cap.usd,
      });
    } else {
      res.status(404).json({ error: "Data not found" });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: "Make sure you are using the correct coin ID from CoinGecko",
    });
  }
});

// Endpoint to search for coins
app.get("/api/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/search`,
      {
        params: {
          query: query,
          x_cg_demo_api_key: COINGECKO_API_KEY,
        },
        headers: {
          "x-cg-demo-api-key": COINGECKO_API_KEY,
        },
      }
    );

    if (response.data && response.data.coins) {
      res.json(
        response.data.coins.map((coin) => ({
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
        }))
      );
    } else {
      res.status(404).json({ error: "No coins found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
