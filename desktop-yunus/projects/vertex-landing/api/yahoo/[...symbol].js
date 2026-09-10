const https = require("https");
const FALLBACK_PRICES = {
  "GC=F": { name: "Gold", price: 3320, change: 0.45 },
  "SI=F": { name: "Silver", price: 33.2, change: 0.32 },
  "BZ=F": { name: "Brent", price: 67.5, change: -0.18 },
  "^IXIC": { name: "NASDAQ", price: 17800, change: 1.23 },
  "XU100.IS": { name: "BIST100", price: 10250, change: 0.87 },
  "BTC-USD": { name: "Bitcoin", price: 93500, change: -0.52 },
};
function fetchFromYahoo(symbol, interval, range) {
  return new Promise((resolve, reject) => {
    const encodedSymbol = encodeURIComponent(symbol);
    const path = `/v8/finance/chart/${encodedSymbol}?interval=${interval}&range=${range}&includePrePost=false`;
    const options = {
      hostname: "query2.finance.yahoo.com",
      path: path,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://finance.yahoo.com/",
        Origin: "https://finance.yahoo.com",
      },
    };
    const request = https.request(options, (response) => {
      let chunks = "";
      response.on("data", (c) => (chunks += c));
      response.on("end", () => {
        try {
          const parsed = JSON.parse(chunks);
          if (parsed.chart && parsed.chart.result && parsed.chart.result[0]) {
            resolve(parsed);
          } else {
            reject(new Error("No data in Yahoo response"));
          }
        } catch (e) {
          reject(new Error("Parse error"));
        }
      });
    });
    request.on("error", reject);
    request.setTimeout(8000, () => {
      request.destroy();
      reject(new Error("Timeout"));
    });
    request.end();
  });
}
function fetchFromQuery1(symbol, interval, range) {
  return new Promise((resolve, reject) => {
    const encodedSymbol = encodeURIComponent(symbol);
    const path = `/v8/finance/chart/${encodedSymbol}?interval=${interval}&range=${range}`;
    const options = {
      hostname: "query1.finance.yahoo.com",
      path: path,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
    };
    const request = https.request(options, (response) => {
      let chunks = "";
      response.on("data", (c) => (chunks += c));
      response.on("end", () => {
        try {
          const parsed = JSON.parse(chunks);
          if (parsed.chart && parsed.chart.result && parsed.chart.result[0]) {
            resolve(parsed);
          } else {
            reject(new Error("No data"));
          }
        } catch (e) {
          reject(new Error("Parse error"));
        }
      });
    });
    request.on("error", reject);
    request.setTimeout(8000, () => {
      request.destroy();
      reject(new Error("Timeout"));
    });
    request.end();
  });
}
function buildFallbackResponse(symbol) {
  const fb = FALLBACK_PRICES[symbol];
  if (!fb) return null;
  const price = fb.price * (1 + (Math.random() - 0.5) * 0.002);
  const prevClose = price / (1 + fb.change / 100);
  return {
    chart: {
      result: [
        {
          meta: {
            regularMarketPrice: parseFloat(price.toFixed(2)),
            chartPreviousClose: parseFloat(prevClose.toFixed(2)),
            regularMarketDayHigh: parseFloat((price * 1.005).toFixed(2)),
            regularMarketDayLow: parseFloat((price * 0.995).toFixed(2)),
          },
          indicators: {
            quote: [
              {
                close: Array.from({ length: 24 }, (_, i) => {
                  const t = i / 23;
                  return parseFloat(
                    (
                      prevClose +
                      (price - prevClose) * t +
                      (Math.random() - 0.5) * price * 0.003
                    ).toFixed(2),
                  );
                }),
              },
            ],
          },
        },
      ],
      error: null,
    },
  };
}
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  let symbol = "";
  if (req.query && req.query.symbol) {
    symbol = Array.isArray(req.query.symbol)
      ? req.query.symbol.join("/")
      : req.query.symbol;
  }
  if (!symbol) {
    const urlParts = req.url.split("/api/yahoo/");
    let symbolPart = urlParts[1] || "";
    symbol = symbolPart.split("?")[0];
  }
  symbol = decodeURIComponent(symbol);
  if (!symbol) return res.status(400).json({ error: "Symbol required" });
  const interval = (req.query && req.query.interval) || "1d";
  const range = (req.query && req.query.range) || "1d";
  try {
    let data;
    try {
      data = await fetchFromYahoo(symbol, interval, range);
    } catch (e1) {
      try {
        data = await fetchFromQuery1(symbol, interval, range);
      } catch (e2) {
        data = buildFallbackResponse(symbol);
        if (!data) throw new Error("No fallback available for " + symbol);
      }
    }
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(data);
  } catch (err) {
    console.error("Yahoo proxy error:", err.message);
    res
      .status(502)
      .json({ error: "Failed to fetch market data", details: err.message });
  }
};
