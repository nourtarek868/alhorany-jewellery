export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120');

  const tried = [];

  // محاولة 1: goldprice.org
  try {
    const r = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const d = await r.json();
    const oz = parseFloat(d?.items?.[0]?.xauPrice);
    if (oz > 1000) return res.json({ oz_usd: oz, source: 'goldprice' });
    tried.push('goldprice: invalid value ' + oz);
  } catch (e) { tried.push('goldprice: ' + e.message); }

  // محاولة 2: metals.live
  try {
    const r = await fetch('https://api.metals.live/v1/spot/gold', {
      signal: AbortSignal.timeout(6000)
    });
    const d = await r.json();
    const oz = parseFloat(d?.[0]?.price);
    if (oz > 1000) return res.json({ oz_usd: oz, source: 'metals.live' });
    tried.push('metals.live: invalid value ' + oz);
  } catch (e) { tried.push('metals.live: ' + e.message); }

  // محاولة 3: gold-api.com (مجاني بدون key)
  try {
    const r = await fetch('https://www.goldapi.io/api/XAU/USD', {
      signal: AbortSignal.timeout(6000),
      headers: { 'x-access-token': 'goldapi-demo' }
    });
    const d = await r.json();
    const oz = parseFloat(d?.price);
    if (oz > 1000) return res.json({ oz_usd: oz, source: 'goldapi' });
  } catch (e) { tried.push('goldapi: ' + e.message); }

  return res.status(502).json({ error: 'all sources failed', tried });
}