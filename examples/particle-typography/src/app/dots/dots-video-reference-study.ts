import type { ToolcraftVideoReferenceStudyEvidence } from "../acceptance/types";

export const dotsVideoReferenceStudy: ToolcraftVideoReferenceStudyEvidence = {
  acceptanceMapping: [
    {
      acceptanceId: "reference.renderer-state",
      behavior:
        "A complete perimeter ring breaks inward with long trajectories and converges on a readable glyph.",
      frameIds: ["f000", "f010", "f050", "f100"],
    },
    {
      acceptanceId: "reference.control-mapping",
      behavior:
        "Particle spring, damping, turbulence, trail, size, and distribution settings own the observed launch and settling qualities.",
      frameIds: ["f010", "f025", "f100", "f300"],
    },
    {
      acceptanceId: "appearance.palette",
      behavior:
        "Warm-to-cool colors remain attached to particles during flight and inside the final letter while point radii change with motion.",
      frameIds: ["f000", "f025", "f100", "f400"],
    },
    {
      acceptanceId: "runtime.timeline.playback",
      behavior:
        "Forward time advances from launch through physical convergence and a long readable hold.",
      frameIds: ["f000", "f050", "f150", "f400"],
    },
  ],
  behaviorDecomposition:
    "Particles begin on a slightly irregular elliptical perimeter, keep stable individual colors, and accelerate toward sampled glyph anchors. The first second contains the largest radial displacement and long colored paths; delayed particles and overshoot create visible stragglers. By roughly one second the N is legible, by three to four seconds most points are settled, and the remaining reference interval preserves a dense readable N with sparse residual trajectories and subtle point-size motion. The Toolcraft version models this with deterministic damped springs, per-particle mass variation, bounded curl turbulence, velocity-driven radius, three temporal trail samples, and a short forward release back to the ring so the exported cycle has an exact first/last seam without reverse playback. Later user requests replace the reference's long hold with adjustable Active and Calm durations; Calm changes the settled interval length while its subtle breathing keeps a fixed real-time rate.",
  extractionEvidence:
    "ffprobe verified 10.548333 seconds, H.264, 1830x2304, 516 decoded frames, nominal 54 fps and average 309600/6401 fps. ffmpeg decoded every frame into framemd5 (523 lines including headers), generated 4 fps three-sheet storyboards, generated a 10 fps opening sheet, and computed per-frame tblend difference metadata. Mean luma difference was 4.6143 across the first 60 decoded differences, 2.5966 across the next 120, and 0.5226 thereafter, confirming a high-energy launch followed by settling rather than a static reveal. Evidence lives in /tmp/dots-video-study.g16hWI.",
  referenceLocation: "/Users/kusnizza/Desktop/Untitled.mp4",
  storyboard: [
    {
      behaviorObservation:
        "The ring is the complete persistent source arrangement; points have medium radii and stable rainbow ordering before acceleration.",
      frameId: "f000",
      frameSource: "/tmp/dots-video-study.g16hWI/opening.jpg cell 1",
      timeSeconds: 0,
      visualObservation:
        "A dense multicolor elliptical ring surrounds an empty black center.",
    },
    {
      behaviorObservation:
        "The first inward impulse produces the longest trajectories and a temporarily hollow center.",
      frameId: "f010",
      frameSource: "/tmp/dots-video-study.g16hWI/opening.jpg cell 2",
      timeSeconds: 0.1,
      visualObservation:
        "Colored endpoints move inward while fine lines still connect toward the perimeter.",
    },
    {
      behaviorObservation:
        "Different masses and target distances create asynchronous crossings rather than one uniform morph.",
      frameId: "f025",
      frameSource: "/tmp/dots-video-study.g16hWI/opening.jpg cells 3-4",
      timeSeconds: 0.5,
      visualObservation:
        "A central red/orange knot and two blue/purple side bands hint at the future N among many overshooting paths.",
    },
    {
      behaviorObservation:
        "Most anchors have been reached while delayed particles and spring overshoot preserve motion around the silhouette.",
      frameId: "f050",
      frameSource: "/tmp/dots-video-study.g16hWI/opening.jpg cells 6-8",
      timeSeconds: 1,
      visualObservation:
        "The N is readable, with dense colored dot bands and a large halo of long curved trails.",
    },
    {
      behaviorObservation:
        "The target shape remains stable while high-energy trajectories decay and outliers continue approaching.",
      frameId: "f100",
      frameSource: "/tmp/dots-video-study.g16hWI/storyboard_01.jpg cells 5-9",
      timeSeconds: 2,
      visualObservation:
        "A solid N dominates the center; the black negative spaces are clear and trajectory density is lower.",
    },
    {
      behaviorObservation:
        "Damping removes nearly all large oscillation without freezing the individual points into a flat raster.",
      frameId: "f150",
      frameSource: "/tmp/dots-video-study.g16hWI/storyboard_01.jpg cells 12-16",
      timeSeconds: 3,
      visualObservation:
        "The N is compact and filled; only a few colored lines and escaped endpoints remain near the borders.",
    },
    {
      behaviorObservation:
        "The glyph owns the long hold state and preserves color variety and slight radius variation.",
      frameId: "f300",
      frameSource: "/tmp/dots-video-study.g16hWI/storyboard_02.jpg cells 2-8",
      timeSeconds: 6,
      visualObservation:
        "The central N stays unchanged in composition while sparse trails enter from the edges.",
    },
    {
      behaviorObservation:
        "Late frames are a settled physical state, not a crossfade or opaque text overlay.",
      frameId: "f400",
      frameSource: "/tmp/dots-video-study.g16hWI/storyboard_02.jpg cells 11-18",
      timeSeconds: 8,
      visualObservation:
        "Discrete circles remain individually visible across the complete letter with rare moving stragglers.",
    },
  ],
  transitionAnalysis: [
    {
      behaviorDelta:
        "From f000 to f010, every perimeter region releases inward and generates a path, proving the ring is a particle source rather than a decorative border.",
      fromFrameId: "f000",
      id: "f000-f010",
      toFrameId: "f010",
    },
    {
      behaviorDelta:
        "From f010 to f050, trajectories cross and overshoot at different rates while the N becomes readable, proving per-particle spring timing and persistent anchor assignment.",
      fromFrameId: "f010",
      id: "f010-f050",
      toFrameId: "f050",
    },
    {
      behaviorDelta:
        "From f050 to f150, the glyph remains fixed while trail density and outlier distance decay, separating damping from target geometry.",
      fromFrameId: "f050",
      id: "f050-f150",
      toFrameId: "f150",
    },
    {
      behaviorDelta:
        "From f150 to f400, particle colors and point identities persist in the N while only sparse paths change, proving a live settled particle state rather than replacement by text pixels.",
      fromFrameId: "f150",
      id: "f150-f400",
      toFrameId: "f400",
    },
  ],
};
