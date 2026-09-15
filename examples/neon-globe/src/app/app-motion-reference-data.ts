import {
  defineToolcraftMotionReferenceEvidence,
} from "./acceptance/motion-reference-evidence.mjs";
import type {
  ToolcraftMotionReferenceEvent,
  ToolcraftMotionReferenceInput,
} from "./acceptance/reference-study-types";
import firstStudyEvidenceJson from "./reference-studies/motion-v1-ecb194a2782a036d02cd9ede38d995f96f2034831316c1e51ba49224fdef3b21/evidence.json" with { type: "json" };
import secondStudyEvidenceJson from "./reference-studies/motion-v1-3621cea9e4e665ee899f7239f9b26c2fb941e8253ea51f61e1814a1581839467/evidence.json" with { type: "json" };

export const LOGO_ORBIT_MOTION_REFERENCE_ID =
  "motion-reference-v1-fe5ed9ab7cbbdac9ae605c1af0abdda9049c49cd68c635e130c64b0af4ead634" as const;
export const LOGO_ORBIT_REFERENCE_BEHAVIOR_ID =
  "logo-loop-reference-rhythm" as const;

const firstStudyEvidence = defineToolcraftMotionReferenceEvidence(
  firstStudyEvidenceJson,
);
const secondStudyEvidence = defineToolcraftMotionReferenceEvidence(
  secondStudyEvidenceJson,
);

function productEventsFor(
  studyId: string,
  evidence: typeof firstStudyEvidence,
): readonly ToolcraftMotionReferenceEvent[] {
  return evidence.detectedEvents.map((event, index) => ({
    behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
    classification: "product-behavior",
    evidenceEventId: event.eventId,
    id: `${studyId}-logo-rhythm-event-${index + 1}`,
  }));
}

export const logoOrbitMotionReferenceInput = {
  behaviors: [
    {
      acceptanceId: "logos.intro.run",
      description:
        "Ticker rows orbit with a fast pass and a pronounced slowdown around the readable front/default position.",
      id: LOGO_ORBIT_REFERENCE_BEHAVIOR_ID,
      implementationIntent:
        "Use the reference cycle cadence as 1x for the logo orbit, scale that cadence with the Speed control, keep row starts staggered, add late inertia before the stop, and concentrate easing/hold near each logo's final slider position.",
      timingClaims: [
        {
          claim: "cadence",
          studyId: firstStudyEvidence.studyId,
        },
        {
          claim: "duration",
          studyId: firstStudyEvidence.studyId,
        },
        {
          claim: "easing",
          studyId: firstStudyEvidence.studyId,
        },
        {
          claim: "loop-seam",
          studyId: firstStudyEvidence.studyId,
        },
        {
          claim: "speed",
          studyId: secondStudyEvidence.studyId,
        },
      ],
    },
  ],
  kind: "motion-reference",
  referenceId: LOGO_ORBIT_MOTION_REFERENCE_ID,
  studies: [
    {
      evidence: firstStudyEvidence,
      evidencePath:
        "src/app/reference-studies/motion-v1-ecb194a2782a036d02cd9ede38d995f96f2034831316c1e51ba49224fdef3b21/evidence.json",
      events: productEventsFor(firstStudyEvidence.studyId, firstStudyEvidence),
      phases: [
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:0",
          id: "reference-part-1-initial-orbit-pass",
          toFrameId: "source-frame:37",
          visualState:
            "Rows travel quickly across the globe before the first front-position settle.",
        },
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:40",
          id: "reference-part-1-front-slowdown",
          toFrameId: "source-frame:62",
          visualState:
            "Motion compresses into a readable front position with the strongest visual slowdown.",
        },
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:65",
          id: "reference-part-1-fast-wrap",
          toFrameId: "source-frame:100",
          visualState:
            "Rows continue the circular wrap with higher travel speed away from the readable position.",
        },
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:102",
          id: "reference-part-1-second-front-settle",
          toFrameId: "source-frame:162",
          visualState:
            "The next readable front state holds visually longer than the passing segments.",
        },
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:165",
          id: "reference-part-1-next-approach",
          toFrameId: "source-frame:187",
          visualState:
            "Rows approach the following front state with the same decelerating rhythm.",
        },
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:236",
          id: "reference-part-1-loop-seam-sample",
          toFrameId: "source-frame:236",
          visualState:
            "The reviewed first partition includes the loop seam sample used to preserve a forward wrap.",
        },
      ],
      studyId: firstStudyEvidence.studyId,
    },
    {
      evidence: secondStudyEvidence,
      evidencePath:
        "src/app/reference-studies/motion-v1-3621cea9e4e665ee899f7239f9b26c2fb941e8253ea51f61e1814a1581839467/evidence.json",
      events: productEventsFor(secondStudyEvidence.studyId, secondStudyEvidence),
      phases: [
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:190",
          id: "reference-part-2-continuing-approach",
          toFrameId: "source-frame:223",
          visualState:
            "Rows continue into the final reviewed approach with steady motion away from the previous settle.",
        },
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:225",
          id: "reference-part-2-front-slowdown",
          toFrameId: "source-frame:227",
          visualState:
            "The strongest late-cycle change lands at the readable front/default position.",
        },
        {
          behaviorIds: [LOGO_ORBIT_REFERENCE_BEHAVIOR_ID],
          fromFrameId: "source-frame:229",
          id: "reference-part-2-held-wrap",
          toFrameId: "source-frame:235",
          visualState:
            "The source remains near the settled front state before the next forward wrap.",
        },
      ],
      studyId: secondStudyEvidence.studyId,
    },
  ],
} satisfies ToolcraftMotionReferenceInput;
