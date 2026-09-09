import {
  HERO_COMPACT_POST_FRAGMENT_SHADER,
  HERO_DISPERSION_POST_FRAGMENT_SHADER,
  HERO_FIELD_FRAGMENT_SHADER,
  HERO_FIELD_VERTEX_SHADER,
  HERO_FULLSCREEN_VERTEX_SHADER,
  HERO_SCENE_FRAGMENT_SHADER,
  HERO_SPHERE_SCENE_VERTEX_SHADER,
} from './hero-dispersion-post-shader';
import { createHeroProgram, createHeroRollerMesh } from './hero-dispersion-shader';
import type { HeroGalleryImageSource } from './hero-gallery-sources';
import { getHeroRowAngularRates, type HeroPanelZoneBounds } from './hero-sphere-gallery-motion';
import type { HeroSphereGalleryLayout } from './hero-sphere-layout';
import type { HeroSceneSettings } from './hero-scene-settings';
import type { HeroSphereTextureCache } from './hero-sphere-gallery-textures';
import { HERO_DESKTOP_MIN_WIDTH_PX } from './hero-responsive-settings';

export const HERO_SPHERE_PASS_SEQUENCE = ['scene', 'field', 'post'] as const;

const FIELD_COLUMNS = 192;
const FIELD_ROWS = 64;
const MAX_LATITUDE = (85 * Math.PI) / 180;
const MIN_FRAGMENT_HIGHP_PRECISION = 16;

interface RenderTarget {
  framebuffer: WebGLFramebuffer;
  height: number;
  texture: WebGLTexture;
  width: number;
}

interface ProgramBinding {
  locations: Record<string, WebGLUniformLocation | null>;
  position: number;
  program: WebGLProgram;
}

export interface HeroSphereGalleryPasses {
  dispose(): void;
  drawField(settings: HeroSceneSettings, principal: Readonly<{ x: number; y: number }>): void;
  drawPost(input: {
    bounds: HeroPanelZoneBounds;
    crtEnvelope: number;
    effectTime: number;
    frameDt: number;
    grainEnvelope: number;
    panRate: Readonly<{ phi: number; theta: number }>;
    phi0: number;
    pitch: number;
    reducedMotion: boolean;
    settings: HeroSceneSettings;
  }): void;
  drawScene(input: {
    layout: HeroSphereGalleryLayout;
    principal: Readonly<{ x: number; y: number }>;
    rowSources: readonly (readonly HeroGalleryImageSource[])[];
    settings: HeroSceneSettings;
    textures: HeroSphereTextureCache;
  }): void;
  isReady(): boolean;
  setSize(input: {
    backingHeight: number;
    backingWidth: number;
    height: number;
    horizontalMargin: number;
    verticalMargin: number;
    width: number;
  }): boolean;
}

function createProgramBinding(
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string,
  uniforms: readonly string[],
  attribute = 'aPosition',
): ProgramBinding {
  const program = createHeroProgram(gl, vertex, fragment);
  try {
    return {
      locations: Object.fromEntries(
        uniforms.map((name) => [name, gl.getUniformLocation(program, name)]),
      ),
      position: gl.getAttribLocation(program, attribute),
      program,
    };
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  }
}

function createFieldMesh() {
  const vertices: number[] = [];
  for (let row = 0; row < FIELD_ROWS; row += 1) {
    const bottom = -MAX_LATITUDE + (row / FIELD_ROWS) * MAX_LATITUDE * 2;
    const top = -MAX_LATITUDE + ((row + 1) / FIELD_ROWS) * MAX_LATITUDE * 2;
    for (let column = 0; column < FIELD_COLUMNS; column += 1) {
      const left = -Math.PI + (column / FIELD_COLUMNS) * Math.PI * 2;
      const right = -Math.PI + ((column + 1) / FIELD_COLUMNS) * Math.PI * 2;
      vertices.push(left, top, right, top, left, bottom, left, bottom, right, top, right, bottom);
    }
  }
  return new Float32Array(vertices);
}

function deleteRenderTarget(gl: WebGLRenderingContext, target: RenderTarget | null) {
  if (!target) return;
  gl.deleteFramebuffer(target.framebuffer);
  gl.deleteTexture(target.texture);
}

function createRenderTarget(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
  filter: number,
): RenderTarget | null {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) {
    if (texture) gl.deleteTexture(texture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    return null;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return null;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { framebuffer, height, texture, width };
}

function bindMesh(gl: WebGLRenderingContext, binding: ProgramBinding, buffer: WebGLBuffer) {
  gl.useProgram(binding.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(binding.position);
  gl.vertexAttribPointer(binding.position, 2, gl.FLOAT, false, 0, 0);
}

function requireFragmentHighp(gl: WebGLRenderingContext) {
  const highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  if (!highp || highp.precision < MIN_FRAGMENT_HIGHP_PRECISION) {
    throw new Error(
      `The sphere gallery requires fragment highp precision of at least ${MIN_FRAGMENT_HIGHP_PRECISION} bits.`,
    );
  }
}

function setProjectionUniforms(
  gl: WebGLRenderingContext,
  binding: ProgramBinding,
  settings: HeroSceneSettings,
  principal: Readonly<{ x: number; y: number }>,
) {
  const { sphere } = settings.gallery;
  const location = binding.locations;
  gl.uniform1f(location.uBendX, sphere.bendX);
  gl.uniform1f(location.uBendY, sphere.bendY);
  gl.uniform1f(location.uRx, sphere.width);
  gl.uniform1f(location.uRy, sphere.height);
  gl.uniform1f(location.uRz, sphere.depth);
  gl.uniform1f(location.uFocal, settings.perspective);
  gl.uniform2f(location.uPrincipal, principal.x, principal.y);
}

export function createHeroSphereGalleryPasses(gl: WebGLRenderingContext): HeroSphereGalleryPasses {
  requireFragmentHighp(gl);
  const allocatedBuffers: WebGLBuffer[] = [];
  const allocatedPrograms: WebGLProgram[] = [];
  try {
    const projectionUniforms = [
      'uBendX',
      'uBendY',
      'uRx',
      'uRy',
      'uRz',
      'uFocal',
      'uPrincipal',
    ] as const;
    const scene = createProgramBinding(
      gl,
      HERO_SPHERE_SCENE_VERTEX_SHADER,
      HERO_SCENE_FRAGMENT_SHADER,
      [
        ...projectionUniforms,
        'uViewSize',
        'uCardOrigin',
        'uCardSize',
        'uThetaCenter',
        'uPhiCenter',
        'uRenderOrigin',
        'uRenderSize',
        'uImage',
        'uTextureSize',
        'uCornerRadius',
      ],
    );
    allocatedPrograms.push(scene.program);
    const field = createProgramBinding(
      gl,
      HERO_FIELD_VERTEX_SHADER,
      HERO_FIELD_FRAGMENT_SHADER,
      [...projectionUniforms, 'uScreenSize'],
      'aAngles',
    );
    allocatedPrograms.push(field.program);
    const postUniforms = [
      'uScene',
      'uField',
      'uScreenSize',
      'uBackingSize',
      'uSceneSize',
      'uSceneMargin',
      'uPanelBounds',
      'uPanRate',
      'uFrameDt',
      'uEdgeWidth',
      'uCurve',
      'uAmount',
      'uBlur',
      'uSpectrum',
      'uHue',
      'uAura',
      'uFade',
      'uVelocity',
      'uGateGlow',
      'uGateOffset',
      'uGateRefraction',
      'uGateWidth',
      'uTurbulence',
      'uTurbulenceFreq',
      'uWarp',
      'uWarpFace',
      'uWarpOffset',
      'uWarpSharpness',
      'uWarpStyle',
      'uWarpWave',
      'uWarpWaveBlur',
      'uWarpWaveKind',
      'uWarpWaveLength',
      'uCardHeight',
      'uPitch',
      'uRowCount',
      'uRowRates',
      'uRx',
      'uRy',
      'uPhi0',
      'uSamples',
      'uGrain',
      'uGrainSize',
      'uCrt',
      'uCrtScanlines',
      'uCrtPitch',
      'uCrtChroma',
      'uCrtFlicker',
      'uEffectTime',
    ] as const;
    const desktopPost = createProgramBinding(
      gl,
      HERO_FULLSCREEN_VERTEX_SHADER,
      HERO_DISPERSION_POST_FRAGMENT_SHADER,
      postUniforms,
    );
    allocatedPrograms.push(desktopPost.program);
    desktopPost.locations.uRowRates = gl.getUniformLocation(desktopPost.program, 'uRowRates[0]');
    const compactPost = createProgramBinding(
      gl,
      HERO_FULLSCREEN_VERTEX_SHADER,
      HERO_COMPACT_POST_FRAGMENT_SHADER,
      postUniforms,
    );
    allocatedPrograms.push(compactPost.program);
    compactPost.locations.uRowRates = gl.getUniformLocation(compactPost.program, 'uRowRates[0]');

    const cardMesh = createHeroRollerMesh(48, 12);
    const cardBuffer = gl.createBuffer();
    const fieldMesh = createFieldMesh();
    const fieldBuffer = gl.createBuffer();
    const fullscreenMesh = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const fullscreenBuffer = gl.createBuffer();
    if (cardBuffer) allocatedBuffers.push(cardBuffer);
    if (fieldBuffer) allocatedBuffers.push(fieldBuffer);
    if (fullscreenBuffer) allocatedBuffers.push(fullscreenBuffer);
    if (!cardBuffer || !fieldBuffer || !fullscreenBuffer) {
      throw new Error('Unable to allocate sphere gallery pass geometry.');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, cardBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cardMesh, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, fieldBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fieldMesh, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fullscreenMesh, gl.STATIC_DRAW);

    let disposed = false;
    let complete = false;
    let screenWidth = 1;
    let screenHeight = 1;
    let backingWidth = 1;
    let backingHeight = 1;
    let horizontalMargin = 0;
    let verticalMargin = 0;
    let sceneTarget: RenderTarget | null = null;
    let fieldTarget: RenderTarget | null = null;

    return {
      dispose() {
        disposed = true;
        deleteRenderTarget(gl, sceneTarget);
        deleteRenderTarget(gl, fieldTarget);
        sceneTarget = null;
        fieldTarget = null;
        gl.deleteBuffer(cardBuffer);
        gl.deleteBuffer(fieldBuffer);
        gl.deleteBuffer(fullscreenBuffer);
        gl.deleteProgram(scene.program);
        gl.deleteProgram(field.program);
        gl.deleteProgram(desktopPost.program);
        gl.deleteProgram(compactPost.program);
      },
      drawField(settings, principal) {
        if (disposed || !complete || !fieldTarget) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fieldTarget.framebuffer);
        gl.viewport(0, 0, fieldTarget.width, fieldTarget.height);
        gl.disable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CW);
        gl.cullFace(gl.BACK);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        bindMesh(gl, field, fieldBuffer);
        setProjectionUniforms(gl, field, settings, principal);
        gl.uniform2f(field.locations.uScreenSize, screenWidth, screenHeight);
        gl.drawArrays(gl.TRIANGLES, 0, fieldMesh.length / 2);
      },
      drawPost({
        bounds,
        crtEnvelope,
        effectTime,
        frameDt,
        grainEnvelope,
        panRate,
        phi0,
        pitch,
        reducedMotion,
        settings,
      }) {
        if (disposed || !complete || !sceneTarget || !fieldTarget) return;
        const dispersion = settings.dispersion;
        const post =
          screenWidth < HERO_DESKTOP_MIN_WIDTH_PX && dispersion.edgeWidth === 0
            ? compactPost
            : desktopPost;
        const effects = settings.effects;
        const activeGrainEnvelope =
          reducedMotion || !effects.grain.enabled ? 0 : Math.max(0, Math.min(1, grainEnvelope));
        const activeCrtEnvelope =
          reducedMotion || !effects.crt.enabled ? 0 : Math.max(0, Math.min(1, crtEnvelope));
        const crtStrength = Math.max(
          effects.crt.scanlines,
          effects.crt.flicker,
          effects.crt.chroma / 8,
        );
        const rows = settings.gallery.sphere.rows;
        const rowRates = getHeroRowAngularRates(rows, reducedMotion);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, backingWidth, backingHeight);
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        bindMesh(gl, post, fullscreenBuffer);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTarget.texture);
        gl.uniform1i(post.locations.uScene, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fieldTarget.texture);
        gl.uniform1i(post.locations.uField, 1);
        gl.uniform2f(post.locations.uScreenSize, screenWidth, screenHeight);
        gl.uniform2f(post.locations.uBackingSize, backingWidth, backingHeight);
        gl.uniform2f(
          post.locations.uSceneSize,
          screenWidth + horizontalMargin * 2,
          screenHeight + verticalMargin * 2,
        );
        gl.uniform2f(post.locations.uSceneMargin, horizontalMargin, verticalMargin);
        gl.uniform4f(
          post.locations.uPanelBounds,
          bounds.thetaLeft,
          bounds.thetaRight,
          bounds.phiBottom,
          bounds.phiTop,
        );
        gl.uniform2f(post.locations.uPanRate, panRate.theta, panRate.phi);
        gl.uniform1f(post.locations.uFrameDt, Math.max(0, Math.min(0.05, frameDt)));
        gl.uniform1f(post.locations.uEdgeWidth, dispersion.edgeWidth / 100);
        gl.uniform1f(post.locations.uCurve, dispersion.curve);
        gl.uniform1f(post.locations.uAmount, dispersion.amount);
        gl.uniform1f(post.locations.uBlur, dispersion.blur);
        gl.uniform1f(post.locations.uSpectrum, dispersion.spectrum);
        gl.uniform1f(post.locations.uHue, (dispersion.hue * Math.PI) / 180);
        gl.uniform1f(post.locations.uAura, dispersion.aura);
        gl.uniform1f(post.locations.uFade, dispersion.edgeFade);
        gl.uniform1f(post.locations.uVelocity, dispersion.velocity);
        gl.uniform1f(post.locations.uGateGlow, dispersion.gateGlow);
        gl.uniform1f(post.locations.uGateOffset, dispersion.gateOffset / 100);
        gl.uniform1f(post.locations.uGateRefraction, dispersion.gateRefraction);
        gl.uniform1f(post.locations.uGateWidth, dispersion.gateWidth);
        gl.uniform1f(post.locations.uTurbulence, dispersion.turbulence);
        gl.uniform1f(post.locations.uTurbulenceFreq, 1 / Math.max(8, dispersion.turbulenceScale));
        gl.uniform1f(post.locations.uWarp, dispersion.warp);
        gl.uniform1f(post.locations.uWarpFace, dispersion.warpFace);
        gl.uniform1f(post.locations.uWarpOffset, dispersion.warpOffset / 100);
        gl.uniform1f(post.locations.uWarpSharpness, dispersion.warpSharpness);
        gl.uniform1f(post.locations.uWarpStyle, dispersion.warpStyle === 'prism' ? 1 : 0);
        gl.uniform1f(
          post.locations.uWarpWave,
          dispersion.warpWaveEnabled ? dispersion.warpWave : 0,
        );
        gl.uniform1f(
          post.locations.uWarpWaveBlur,
          dispersion.warpWaveEnabled ? dispersion.warpWaveBlur : 0,
        );
        gl.uniform1f(post.locations.uWarpWaveKind, dispersion.warpWaveKind === 'glass' ? 1 : 0);
        gl.uniform1f(post.locations.uWarpWaveLength, dispersion.warpWaveLength);
        gl.uniform1f(post.locations.uCardHeight, settings.gallery.cardHeight);
        gl.uniform1f(post.locations.uPitch, pitch);
        gl.uniform1f(post.locations.uRowCount, Math.max(1, rows.length));
        gl.uniform1fv(post.locations.uRowRates, rowRates);
        gl.uniform1f(post.locations.uRx, settings.gallery.sphere.width);
        gl.uniform1f(post.locations.uRy, settings.gallery.sphere.height);
        gl.uniform1f(post.locations.uPhi0, phi0);
        gl.uniform1i(
          post.locations.uSamples,
          Math.max(2, Math.min(48, Math.round(dispersion.count))),
        );
        gl.uniform1f(post.locations.uGrain, effects.grain.amount * activeGrainEnvelope);
        gl.uniform1f(post.locations.uGrainSize, effects.grain.size);
        gl.uniform1f(post.locations.uCrt, crtStrength * activeCrtEnvelope);
        gl.uniform1f(post.locations.uCrtScanlines, effects.crt.scanlines * activeCrtEnvelope);
        gl.uniform1f(post.locations.uCrtPitch, effects.crt.pitch);
        gl.uniform1f(post.locations.uCrtChroma, effects.crt.chroma * activeCrtEnvelope);
        gl.uniform1f(post.locations.uCrtFlicker, effects.crt.flicker * activeCrtEnvelope);
        gl.uniform1f(post.locations.uEffectTime, effectTime);
        gl.drawArrays(gl.TRIANGLES, 0, fullscreenMesh.length / 2);
      },
      drawScene({ layout, principal, rowSources, settings, textures }) {
        if (disposed || !complete || !sceneTarget) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget.framebuffer);
        gl.viewport(0, 0, sceneTarget.width, sceneTarget.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CW);
        gl.cullFace(gl.BACK);
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        bindMesh(gl, scene, cardBuffer);
        setProjectionUniforms(gl, scene, settings, principal);
        gl.uniform2f(scene.locations.uRenderOrigin, horizontalMargin, verticalMargin);
        gl.uniform2f(
          scene.locations.uRenderSize,
          screenWidth + horizontalMargin * 2,
          screenHeight + verticalMargin * 2,
        );
        gl.uniform1i(scene.locations.uImage, 0);

        for (const card of layout.cards) {
          const source = rowSources[card.rowIndex]?.[card.sourceIndex];
          if (!source) continue;
          const texture = textures.ensure(source);
          if (!texture || texture.status !== 'ready') continue;
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture.texture);
          gl.uniform2f(scene.locations.uTextureSize, texture.width, texture.height);
          gl.uniform2f(
            scene.locations.uViewSize,
            card.arcWidth + horizontalMargin * 2,
            settings.gallery.cardHeight + verticalMargin * 2,
          );
          gl.uniform2f(scene.locations.uCardOrigin, horizontalMargin, verticalMargin);
          gl.uniform2f(scene.locations.uCardSize, card.arcWidth, settings.gallery.cardHeight);
          gl.uniform1f(scene.locations.uCornerRadius, settings.gallery.cardRadius);
          gl.uniform1f(scene.locations.uThetaCenter, card.thetaCenter);
          gl.uniform1f(scene.locations.uPhiCenter, card.phiCenter);
          gl.drawArrays(gl.TRIANGLES, 0, cardMesh.length / 2);
        }
      },
      isReady() {
        return !disposed && complete;
      },
      setSize({
        backingHeight: nextBackingHeight,
        backingWidth: nextBackingWidth,
        height,
        horizontalMargin: nextHorizontalMargin,
        verticalMargin: nextVerticalMargin,
        width,
      }) {
        screenWidth = Math.max(1, width);
        screenHeight = Math.max(1, height);
        backingWidth = Math.max(1, nextBackingWidth);
        backingHeight = Math.max(1, nextBackingHeight);
        horizontalMargin = Math.max(0, nextHorizontalMargin);
        verticalMargin = Math.max(0, nextVerticalMargin);
        const ratioX = backingWidth / screenWidth;
        const ratioY = backingHeight / screenHeight;
        const sceneWidth = backingWidth + Math.round(horizontalMargin * ratioX) * 2;
        const sceneHeight = backingHeight + Math.round(verticalMargin * ratioY) * 2;
        const unchanged =
          sceneTarget?.width === sceneWidth &&
          sceneTarget.height === sceneHeight &&
          fieldTarget?.width === backingWidth &&
          fieldTarget.height === backingHeight;
        if (unchanged) return complete;

        deleteRenderTarget(gl, sceneTarget);
        deleteRenderTarget(gl, fieldTarget);
        sceneTarget = createRenderTarget(gl, sceneWidth, sceneHeight, gl.LINEAR);
        fieldTarget = createRenderTarget(gl, backingWidth, backingHeight, gl.NEAREST);
        complete = sceneTarget !== null && fieldTarget !== null;
        if (!complete) {
          deleteRenderTarget(gl, sceneTarget);
          deleteRenderTarget(gl, fieldTarget);
          sceneTarget = null;
          fieldTarget = null;
        }
        return complete;
      },
    };
  } catch (error) {
    allocatedBuffers.forEach((buffer) => gl.deleteBuffer(buffer));
    allocatedPrograms.forEach((program) => gl.deleteProgram(program));
    throw error;
  }
}
