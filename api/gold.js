export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');

  const SOURCES = [
    'https://banklive.net/en/gold-price-today-in-egypt',
    'https://gold.youm7.com/',
    'https://www.egcurrency.com/gold-price-in-egypt',
    'https://arabicgold.net/gold-price-today-egypt/',
  ];

  function extract(html, source) {
    if (!html || html.length < 500) return 0;

    if (source.includes('banklive')) {
      const m = html.match(/current price of gold is ([\d.]+) for 24/i);
      if (m) return parseFloat(m[1]);
      const m21 = html.match(/current price of gold is ([\d.]+) for 21/i);
      if (m21) return parseFloat(m21[1]) * 24 / 21;
    }

    if (source.includes('youm7')) {
      const m = html.match(/عيار[^\d]*(24)[^\d]*([\d,]+)/);
      if (m) return parseFloat(m[2].replace(/,/g, ''));
      const m21 = html.match(/عيار[^\d]*(21)[^\d]*([\d,]+)/);
      if (m21) return parseFloat(m21[2].replace(/,/g, '')) * 24 / 21;
    }

    const patterns = [
      /عيار\s*24[^0-9]*([\d,]+)/,
      /24\s*عيار[^0-9]*([\d,]+)/,
      /"price24"[^0-9]*([\d,]+)/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) {
        const v = parseFloat(m[1].replace(/,/g, ''));
        if (v > 5000 && v < 25000) return v;
      }
    }

    const m21 = html.match(/عيار\s*21[^0-9]*([\d,]+)/);
    if (m21) {
      const v = parseFloat(m21[1].replace(/,/g, ''));
      if (v > 4000 && v < 22000) return v * 24 / 21;
    }

    return 0;
  }

  for (const source of SOURCES) {
    try {
      const r = await fetch(source, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ar,en;q=0.5',
        }
      });

      if (!r.ok) {
        console.log(`${source} returned ${r.status}`);
        continue;
      }

      const html = await r.text();
      const gram24 = extract(html, source);

      if (gram24 > 5000 && gram24 < 25000) {
        console.log(`✓ got ${gram24} from ${source}`);
        return res.json({ gram24, source });
      }

      console.log(`✗ invalid value ${gram24} from ${source}`);
    } catch (e) {
      console.log(`✗ ${source}: ${e.message}`);
    }
  }

  return res.status(502).json({ error: 'all egypt sources failed' });
}
