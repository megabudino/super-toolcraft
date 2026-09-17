import { icebergParameters, icebergTarget } from '../src/app/iceberg-controls';
import { expect, test } from './toolcraft-product-test';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from './product-observable-helpers';
import { dragNumber, icebergSelector, openIceberg, setIcebergTimelineFrame } from './iceberg-test-helpers';
import { verifySidePatterns, verifyFaceColumns, viewTileFace } from './iceberg-pattern-check';
import { expectToolcraftDiscreteSliderMarkers } from './performance-control-layout-helpers';
import { verifyGridContinuity } from './iceberg-grid-continuity-check';
import { verifyGridEdgeThickness, verifyGridFacing } from './iceberg-grid-facing-check';
import { verifyPlaneLineDensity, verifyPlaneLineDirection, verifyPlaneLineThickness } from './iceberg-plane-pattern-check';

for (const p of icebergParameters.filter(p => p.section === 'patterns')) {
  test(`browser: iceberg ${p.key} changes visible relief live`, async ({ page }) => {
    await openIceberg(page);
    for (const title of ['Mountain', 'Base', 'Base patterns', 'Material']) {
      const section = page.getByRole('button', { name: `Toggle ${title} section` });
      if (await section.getAttribute('aria-expanded') === 'false') await section.click();
    }
    if ('discrete' in p) {
      await viewTileFace(page, p.key);
      await expectToolcraftDiscreteSliderMarkers(page, icebergTarget(p.key));
    }
    const session = await createToolcraftBrowserProofSession(page), target = icebergTarget(p.key);
    if (p.key.startsWith('planeLine')) await setIcebergTimelineFrame(page, 'end');
    const before = await getToolcraftProductObservableSnapshot(page, { selector: icebergSelector });
    await expectToolcraftProductObservableToChange(session, session.controlAction(target, async () => {
      await dragNumber(page, target, async () => {
        await expect.poll(() => getToolcraftProductObservableSnapshot(page, { selector: icebergSelector })).not.toBe(before);
      });
    }), { requirementId: target, selector: icebergSelector });
    if ('discrete' in p) await verifyFaceColumns(page, p.key);
    if (p.key === 'gridStrength') await verifySidePatterns(page);
    if (p.key === 'gridThickness') { await verifyGridFacing(page); await verifyGridEdgeThickness(page); await verifyGridContinuity(page); }
    if (p.key === 'planeLineThickness') await verifyPlaneLineThickness(page);
    if (p.key === 'planeLineDensity') await verifyPlaneLineDensity(page);
    if (p.key === 'planeLineDirection') await verifyPlaneLineDirection(page);
  });
}
