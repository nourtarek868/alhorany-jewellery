async function fetchEgyptPrices() {
  try {
    const [goldRes, ratesRes] = await Promise.allSettled([
      fetch('/api/gold',  { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/rates', { cache: 'no-store' }).then(r => r.json())
    ]);

    const goldData  = goldRes.status  === 'fulfilled' ? goldRes.value  : null;
    const ratesData = ratesRes.status === 'fulfilled' ? ratesRes.value : null;

    console.log('gold →', goldData);
    console.log('rates →', ratesData);

    const gram24 = goldData?.gram24 ? parseFloat(goldData.gram24) : null;
    const usdEgp = ratesData?.usd_egp ? parseFloat(ratesData.usd_egp) : null;

    if (gram24 && gram24 > 5000) {
      if (usdEgp && usdEgp > 30) lastUsdEgp = usdEgp;
      const ozUSD = lastOzUSD;
      const ozEGP = gram24 * 31.1035;
      lastGram24 = gram24;
      return { gram: gram24, ounce: ozEGP, usd: ozUSD };
    }

    if (usdEgp && usdEgp > 30 && lastOzUSD > 1000) {
      lastUsdEgp = usdEgp;
      const gram = (lastOzUSD * usdEgp) / 31.1035;
      return { gram, ounce: lastOzUSD * usdEgp, usd: lastOzUSD };
    }

  } catch (e) {
    console.error('fetchEgyptPrices error:', e);
  }
  return null;
}
