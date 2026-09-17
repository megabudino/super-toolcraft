import { appSchema } from '../src/app/app-schema';
import { appControlSectionInventory, getToolcraftControlApplicabilityCases, getToolcraftApplicabilityRequirementId } from '../src/app/app-acceptance';
import { icebergParameters, icebergTarget } from '../src/app/iceberg-controls';
import { expect, test } from './toolcraft-product-test';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftControlApplicabilityState } from './browser-control-applicability-evidence';
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from './product-observable-helpers';
import { downloadImage, dragNumber, icebergSelector, inspectImage, openIceberg, setChoice } from './iceberg-test-helpers';
import { assertRockOnlyEngraving, engravingPixels, engravingScopeFixture, verifyEngravingScale } from './iceberg-engraving-check';

test('browser: iceberg engraving preserves cube and original material', async ({ page }) => {
  await openIceberg(page);
  await engravingScopeFixture(page);
  const plain = await engravingPixels(page), session = await createToolcraftBrowserProofSession(page);
  const toggle = page.getByRole('switch', { name: 'Engraving', exact: true });
  await expectToolcraftProductObservableToChange(session, session.controlAction('iceberg.engravingEnabled', async () => {
    await toggle.check();
  }), { requirementId: 'iceberg.engravingEnabled', selector: icebergSelector });
  assertRockOnlyEngraving(plain, await engravingPixels(page));
  await setChoice(page, 'export.image.resolution', '2K');
  const engravedExport = await inspectImage(page, await downloadImage(page));
  expect(engravedExport.inspection.width).toBe(1536);
  expect(engravedExport.inspection.height).toBe(2048);
  await toggle.uncheck();
  expect(await engravingPixels(page), 'Disabling restores the original material exactly').toEqual(plain);
  const plainExport = await inspectImage(page, await downloadImage(page));
  expect(engravedExport.inspection.decodedPixelHash).not.toBe(plainExport.inspection.decodedPixelHash);
});

for (const p of icebergParameters.filter(p => p.section === 'engraving')) {
  test(`browser: iceberg ${p.key} changes visible relief live`, async ({ page }) => {
    await openIceberg(page);
    const session = await createToolcraftBrowserProofSession(page), target = icebergTarget(p.key);
    const cases = getToolcraftControlApplicabilityCases({ schema: appSchema, sectionInventory: appControlSectionInventory, target });
    expect(cases).toHaveLength(2);
    for (const c of cases) {
      await expectToolcraftControlApplicabilityState(session, session.controlAction(c.selectorTarget, async () => {
        await page.getByRole('switch', { name: 'Engraving', exact: true }).setChecked(c.selectorValue as boolean);
      }), c, { baseRequirementId: target });
      if (c.expectation === 'hidden') continue;
      const before = await getToolcraftProductObservableSnapshot(page, { selector: icebergSelector });
      await expectToolcraftProductObservableToChange(session, session.controlAction(target, async () => {
        await dragNumber(page, target, async () => {
          await expect.poll(() => getToolcraftProductObservableSnapshot(page, { selector: icebergSelector })).not.toBe(before);
        });
      }), { requirementId: getToolcraftApplicabilityRequirementId(target, c), selector: icebergSelector });
    }
    if (p.key === 'engravingScale') await verifyEngravingScale(page);
  });
}
