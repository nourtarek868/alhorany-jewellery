export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  // محاولة 1: frankfurter
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=USD&to=EGP', {
      signal: AbortSignal.timeout(6000)
    });
    const d = await r.json();
    const rate = parseFloat(d?.rates?.EGP);
    if (rate > 30) return res.json({ usd_egp: rate, source: 'frankfurter' });
  } catch (e) {}

  // محاولة 2: exchangerate-api
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(6000)
    });
    const d = await r.json();
    const rate = parseFloat(d?.rates?.EGP);
    if (rate > 30) return res.json({ usd_egp: rate, source: 'er-api' });
  } catch (e) {}

  // محاولة 3: fixer fallback
  try {
    const r = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {
      signal: AbortSignal.timeout(6000)
    });
    const d = await r.json();
    const rate = parseFloat(d?.usd?.egp);
    if (rate > 30) return res.json({ usd_egp: rate, source: 'fawaz-api' });
  } catch (e) {}

  return res.status(502).json({ error: 'rates fetch failed' });
}