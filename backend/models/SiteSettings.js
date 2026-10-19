const mongoose = require('mongoose');

const DEFAULT_ABOUT_PARAGRAPHS = [
  'VRANT is a Ghanaian fashion house where local style meets the modern wardrobe.',
  'We take the cloth, colour and craft we grew up with — kente, batakari, adinkra and wax print — and cut them into clean, contemporary clothing, denim and hand-finished footwear made for everyday wear.',
  'Every piece honours where it comes from, and is made for wherever you are going.',
];

const DEFAULT_STORE_EMAIL = 'hello@vrant.com';
const DEFAULT_STORE_CITY = 'Takoradi, GH';

const siteSettingsSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: '' },
    logoAlt: { type: String, default: 'VRANT' },
    storeName: { type: String, default: 'VRANT' },
    storeEmail: { type: String, default: DEFAULT_STORE_EMAIL },
    storePhone: { type: String, default: '020 090 6851' },
    storeCity: { type: String, default: DEFAULT_STORE_CITY },
    heroImageUrl: { type: String, default: '/lookbook/look-13.jpg' },
    /** Desktop hero triptych side panels (centre panel is heroImageUrl) */
    heroImageLeftUrl: { type: String, default: '/lookbook/look-18.jpg' },
    heroImageRightUrl: { type: String, default: '/lookbook/look-25.jpg' },
    heroImageAlt: { type: String, default: 'VRANT campaign' },
    aboutEyebrow: { type: String, default: 'Our story' },
    aboutTitle: { type: String, default: 'About VRANT' },
    aboutParagraphs: {
      type: [String],
      default: () => [...DEFAULT_ABOUT_PARAGRAPHS],
    },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
module.exports.DEFAULT_ABOUT_PARAGRAPHS = DEFAULT_ABOUT_PARAGRAPHS;
module.exports.DEFAULT_STORE_EMAIL = DEFAULT_STORE_EMAIL;
module.exports.DEFAULT_STORE_CITY = DEFAULT_STORE_CITY;
