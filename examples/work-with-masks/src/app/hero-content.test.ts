import { describe, expect, it } from 'vitest';
import { heroContent, referenceBrands, partnerLogos } from '@/section/components/pages/home/hero-content';
import { brandLetterPaths, brandIconPaths } from '@/section/components/header-brand';

describe('replacement hero content', () => {
  it('keeps the original 4/11/19/10 word counts and two heading lines', () => {
    const words = (text: string) => text.trim().split(/\s+/).length;
    expect(heroContent.heading).toHaveLength(2);
    expect([
      words(heroContent.heading.join(' ')), words(heroContent.lead), words(heroContent.body),
      words(`${heroContent.captionEmphasis} ${heroContent.captionRest}`),
    ]).toEqual([4, 11, 19, 10]);
  });
  it('restores real reference brands while retaining the existing rotation cardinality', () => {
    expect(referenceBrands).toHaveLength(24);
    expect(new Set(partnerLogos.map(logo => logo.src)).size).toBe(24);
    expect(partnerLogos.every(logo => !logo.src.includes('/concepts/'))).toBe(true);
    expect(partnerLogos.slice(0, 6).map(logo => logo.alt)).toEqual([
      'Adidas', 'Ford', 'eBay', 'Revolut', 'American Express', 'Citi',
    ]);
    expect(partnerLogos[3].src).toBe('/images/home/hero/revolut.svg');
    expect(partnerLogos.every(logo => logo.width === 245 && logo.height === 80)).toBe(true);
    expect(brandLetterPaths).toHaveLength(8);
    expect(brandIconPaths).toHaveLength(3);
  });
});
