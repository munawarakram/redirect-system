// Netlify Affiliate Redirect Function (Stable + Clean)
export async function handler(event, context) {

  // 1) Product URL from ?u=
  const productURL = event.queryStringParameters.u;
  if (!productURL) {
    return {
      statusCode: 400,
      body: "Missing product URL"
    };
  }

  // 2) Load affiliate configuration
  const AFF_CONFIG_URL =
    "https://cdn.jsdelivr.net/gh/munawarakram/cpa-config@main/affiliate.json";

  try {
    const res = await fetch(AFF_CONFIG_URL, { cache: "no-store" });
    const cfg = await res.json();

    // 3) Weighted affiliate selection
    const total = cfg.reduce((sum, x) => sum + x.weight, 0);
    let rnd = Math.random() * total;
    let selected = cfg[0];

    for (const entry of cfg) {
      rnd -= entry.weight;
      if (rnd <= 0) {
        selected = entry;
        break;
      }
    }

    const aff = selected.aff;
    const type = selected.type;

    // 4) Extract AliExpress item ID
    const itemId = productURL.match(/item\/(\d+)\.html/)?.[1];

    if (!itemId) {
      return {
        statusCode: 400,
        body: "Invalid product URL"
      };
    }

    // 5) FINAL AliExpress Redirect (NO LOOP)
    const redirectURL =
      "https://www.aliexpress.com/item/" +
      itemId +
      ".html?aff=" +
      encodeURIComponent(aff) +
      "&type=" +
      encodeURIComponent(type) +
      "&nf=1"; // Prevent Tampermonkey re-trigger

    return {
      statusCode: 302,
      headers: {
        Location: redirectURL
      }
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: "Affiliate config load failed: " + err
    };
  }
}
