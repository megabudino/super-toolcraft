import { publicAssetUrl } from '@/section/reference/public-asset-url';

/** Fold Studio demo copy; reference brand marks do not imply customer endorsements. */
export const heroContent = {
  heading: ['Get Noticed.', 'Keep Growing.'],
  lead: 'Every card purchase can become the start of a lasting connection.',
  body: 'Meet people in the payment apps they trust, and turn their everyday spending into lasting relationships with your brand.',
  captionEmphasis: 'Helping ambitious brands',
  captionRest: "become part of every customer's daily routine.",
  previewSrc: publicAssetUrl('images/home/hero/online-shopping.jpg'),
} as const;

export const referenceBrands = [
  ['adidas', 'Adidas'], ['ford', 'Ford'], ['ebay', 'eBay'], ['revolut', 'Revolut'],
  ['american-express', 'American Express'], ['citi', 'Citi'],
  ['bank-of-america', 'Bank of America'], ['capital-one', 'Capital One'],
  ['cvs', 'CVS'], ['walgreens', 'Walgreens'], ['tripadvisor', 'Tripadvisor'],
  ['crocs', 'Crocs'], ['stubhub', 'StubHub'], ['shiseido', 'Shiseido'],
  ['gnc', 'GNC'], ['pnc', 'PNC'], ['iherb', 'iHerb'], ['fis', 'FIS'],
  ['faire', 'Faire'], ['codecademy', 'Codecademy'], ['rag-and-bone', 'rag & bone'],
  ['zenni', 'Zenni'], ['baublebar', 'BaubleBar'], ['dxl', 'DXL Big + Tall'],
] as const;

export const partnerLogos = referenceBrands.map(([id, alt]) => ({
  src: publicAssetUrl(`images/home/hero/${id === 'revolut' ? id : `logos/${id}`}.svg`),
  alt, width: 245, height: 80,
}));
