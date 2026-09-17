import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expectToolcraftExportedArtifact } from './browser-acceptance-outcome-helpers';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { openIceberg, setNumber } from './iceberg-test-helpers';
import { expect, test } from './toolcraft-product-test';
import { icebergSettingsExportTarget } from '../src/app/iceberg-settings-export';

test('browser: iceberg exports current application settings', async ({ page }) => {
  await openIceberg(page);
  const session = await createToolcraftBrowserProofSession(page);
  await page.getByRole('button', { name: 'Reset controls', exact: true }).click();
  await setNumber(page, 'iceberg.plateGap', 0.37);

  const downloadSettings = async () => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Settings', exact: true }).click();
    return pending;
  };

  await expectToolcraftExportedArtifact(
    session.targetAction(icebergSettingsExportTarget, downloadSettings),
    async download => {
      expect(download.suggestedFilename()).toBe('neon-iceberg-2-settings.json');
      const artifactPath = await download.path();
      expect(artifactPath).not.toBeNull();
      const bytes = await readFile(artifactPath!);
      const payload = JSON.parse(bytes.toString('utf8')) as Record<string, any>;

      expect(payload).toMatchObject({
        appId: 'neon-iceberg-2',
        attachments: [],
        source: 'toolcraft-settings',
        version: 3,
        canvas: { mode: 'infinite', size: { width: 1200, height: 1600 } },
        timeline: { isPlaying: false },
      });
      expect(payload.values['iceberg.plateGap']).toBe(0.37);
      expect(payload.values['view.orbit']).toEqual({
        position: [5.398182941229226, 2.21363371348611, 4.971865516638815],
        up: [-0.21241246223585997, 0.9573959336839413, -0.19563734830638396],
      });
      expect(new Date(payload.exportedAt).toISOString()).toBe(payload.exportedAt);

      return {
        byteLength: bytes.byteLength,
        contentHash: createHash('sha256').update(bytes).digest('hex'),
        mediaType: 'application/json',
      };
    },
    { requirementId: 'settings.export' },
  );
});
