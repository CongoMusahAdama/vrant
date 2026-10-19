const mongoose = require('mongoose');

const DEFAULT_ABOUT_PARAGRAPHS = [
  'VRANT is a fashion house from Takoradi, Ghana — made for people who wear their heritage with confidence.',
  'We design clothing, denim and footwear that carry Ghanaian craft into the modern wardrobe: hand-pintucked diamond sets, kaftans with bold hand-cut print bibs, wax-print panel shirts and hand-finished suede slides with the VRANT script.',
  'Every piece is cut and finished by our own tailors, in small runs, with the kind of detail you feel the moment you put it on.',
  'Have a design of your own? Bring us your sketch or idea and we will make it just for you.',
  'VRANT — rooted in Ghana, cut for now.',
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
