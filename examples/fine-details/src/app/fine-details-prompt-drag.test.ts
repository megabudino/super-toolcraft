import { describe, expect, it } from 'vitest';

import { appAcceptance, appProductReadiness } from './app-acceptance-data';
import { fineDetailsPromptTargets } from './fine-details-prompt-values';

describe('Fine Details visitor prompt drag', () => {
  it('visitor prompt dragging is declared as a transient canvas-owned offset', () => {
    if (appProductReadiness.mode !== 'product') {
      throw new Error('Fine Details must use product readiness.');
    }

    expect(
      appProductReadiness.interactionOwnership.find(
        (entry) => entry.id === 'canvas-fine-details-prompt-runtime-offset',
      ),
    ).toMatchObject({
      capability: 'direct-spatial-edit',
      surface: 'canvas',
      target: fineDetailsPromptTargets.position,
    });

    expect(
      appProductReadiness.interactionOwnership.find(
        (entry) => entry.id === 'panel-fine-details-prompt-position',
      ),
    ).toMatchObject({
      capability: 'property-edit',
      surface: 'panel',
      target: fineDetailsPromptTargets.position,
    });
  });

  it('registers one runtime acceptance row for drag and animated reset', () => {
    expect(appAcceptance.filter((entry) => entry.id === 'prompt.runtimeOffset')).toEqual([
      expect.objectContaining({
        automatedTestName:
          'visitor prompt dragging is declared as a transient canvas-owned offset',
        browserTestName: 'browser: visitor drags and resets the Fine Details prompt',
        componentType: 'canvas',
        evidence: 'product-output',
        interactionId: 'canvas-fine-details-prompt-runtime-offset',
        kind: 'runtime',
        target: fineDetailsPromptTargets.position,
      }),
    ]);
  });
});
