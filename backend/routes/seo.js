const express = require('express');
const Product = require('../models/Product');
const { catalogIdFromMongoId } = require('../lib/catalogId');
const { publicSiteUrl } = require('../lib/publicSiteUrl');

const router = express.Router();

/** Public pages worth indexing, with how often they change */
const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/custom-design', changefreq: 'monthly', priority: '0.8' },
  { path: '/gallery', changefreq: 'weekly', priority: '0.7' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/shipping', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.2' },
];

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

/**
 * Live sitemap: static pages plus every active product, so new products
 * reach search engines without anyone editing a file.
 * Served at /sitemap.xml (rewritten here by vercel.json) and /api/sitemap.xml.
 */
async function sitemap(req, res) {
  const base = publicSiteUrl().replace(/\/$/, '');
  try {
    const products = await Product.find({ isActive: true }).select('_id updatedAt images.front name').lean();
    const urls = [
      ...STATIC_PAGES.map(
        (p) => `  <url><loc>${base}${p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
      ),
      ...products.map((p) => {
        const loc = `${base}/products/${catalogIdFromMongoId(p._id)}`;
        const lastmod = p.updatedAt ? `<lastmod>${new Date(p.updatedAt).toISOString().slice(0, 10)}</lastmod>` : '';
        const img = p.images?.front
          ? `<image:image><image:loc>${escapeXml(p.images.front.startsWith('http') ? p.images.front : base + p.images.front)}</image:loc><image:title>${escapeXml(p.name)}</image:title></image:image>`
          : '';
        return `  <url><loc>${loc}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority>${img}</url>`;
      }),
    ];

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
        `${urls.join('\n')}\n</urlset>\n`
    );
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).type('text/plain').send('Sitemap temporarily unavailable');
  }
}

router.get(['/sitemap.xml', '/api/sitemap.xml'], sitemap);

module.exports = router;
