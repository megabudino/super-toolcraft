const vertexShaderSource = `
  precision highp float;
  attribute vec3 aPosition;
  attribute vec2 aUv;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform float uCardHeight;
  uniform float uCardWidth;
  uniform float uCurveRadius;
  uniform float uEdgePull;
  varying vec2 vUv;

  void main() {
    vUv = aUv;
    vec3 p = aPosition;
    p.x *= uCardWidth;
    p.y *= uCardHeight;

    float safeCurveRadius = max(uCurveRadius, 0.0001);
    float curveAngle = p.x / safeCurveRadius;
    p.x = sin(curveAngle) * safeCurveRadius;
    p.z += (cos(curveAngle) - 1.0) * safeCurveRadius;

    float halfHeight = uCardHeight * 0.5;
    float pullAmount = abs(uEdgePull);
    float sagitta = max(pullAmount, 0.0001);
    float arcRadius = (halfHeight * halfHeight + sagitta * sagitta) / (2.0 * sagitta);
    float arcDepth = arcRadius - sqrt(max(arcRadius * arcRadius - p.y * p.y, 0.0));
    p.z -= arcDepth * sign(uEdgePull) * step(0.0001, pullAmount);

    vec4 viewPosition = uModelViewMatrix * vec4(p, 1.0);
    gl_Position = uProjectionMatrix * viewPosition;
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uTextureAspect;
  uniform float uPlaneAspect;
  uniform float uFocus;
  uniform float uFocusFloor;
  uniform float uOpacity;
  uniform float uCornerRadius;
  uniform float uFlipX;
  uniform float uFlipY;
  uniform float uRotation;
  uniform float uShadowPass;
  uniform vec4 uShadowColor;
  uniform float uShadowInset;
  varying vec2 vUv;

  vec2 applyTransform(vec2 uv) {
    vec2 point = uv - 0.5;
    if (uFlipX > 0.5) point.x *= -1.0;
    if (uFlipY > 0.5) point.y *= -1.0;
    if (uRotation > 0.5 && uRotation < 1.5) point = vec2(point.y, -point.x);
    else if (uRotation >= 1.5 && uRotation < 2.5) point = -point;
    else if (uRotation >= 2.5) point = vec2(-point.y, point.x);
    return point + 0.5;
  }

  void main() {
    if (uShadowPass > 0.5) {
      // The enlarged shadow quad paints the card's rounded silhouette in
      // soft translucent black: full inside the inset silhouette, feathered
      // out to the quad edge.
      vec2 shadowUv = vec2((vUv.x - 0.5) * uPlaneAspect, vUv.y - 0.5);
      float shadowRadius = uCornerRadius * uShadowInset;
      vec2 shadowSize = vec2(uPlaneAspect * 0.5, 0.5) * uShadowInset;
      vec2 shadowCorner = abs(shadowUv) - (shadowSize - shadowRadius);
      float shadowDistance = length(max(shadowCorner, 0.0))
        + min(max(shadowCorner.x, shadowCorner.y), 0.0)
        - shadowRadius;
      float feather = max(0.5 * (1.0 - uShadowInset), 0.02);
      float mask = 1.0 - smoothstep(-0.35 * feather, feather, shadowDistance);
      gl_FragColor = vec4(uShadowColor.rgb, mask * uShadowColor.a * uOpacity);
      return;
    }

    vec2 uv = vUv - 0.5;
    float ratio = uPlaneAspect / max(uTextureAspect, 0.0001);
    if (ratio > 1.0) uv.y /= ratio;
    else uv.x *= ratio;
    uv = applyTransform(uv + 0.5);

    vec4 image = texture2D(uTexture, uv);
    vec2 roundedUv = vec2((vUv.x - 0.5) * uPlaneAspect, vUv.y - 0.5);
    vec2 roundedSize = vec2(uPlaneAspect * 0.5, 0.5);
    vec2 cornerDistance = abs(roundedUv) - (roundedSize - uCornerRadius);
    float roundedDistance = length(max(cornerDistance, 0.0))
      + min(max(cornerDistance.x, cornerDistance.y), 0.0)
      - uCornerRadius;
    float roundedAlpha = 1.0 - smoothstep(-0.0025, 0.0025, roundedDistance);
    vec3 color = mix(image.rgb * uFocusFloor, image.rgb, uFocus);
    gl_FragColor = vec4(color, image.a * roundedAlpha);
    gl_FragColor.a *= uOpacity;
  }
`;

type Matrix = Float32Array;
type Vector3 = readonly [number, number, number];

export type SpiralGlTexture = {
  aspect: number;
  dispose: () => void;
  flipX: number;
  flipY: number;
  handle: WebGLTexture;
  loaded: boolean;
  ready: Promise<void>;
  rotation: number;
};

export type SpiralGlCard = {
  /** 0 keeps the shared cylindrical/flex bend; 1 renders the card nearly flat. */
  flatten: number;
  focus: number;
  opacity: number;
  position: Vector3;
  renderOrder: number;
  rotationX: number;
  rotationY: number;
  scale: number;
  texture: SpiralGlTexture;
};

export type SpiralGlFrame = {
  camera: { aspect: number; fovDegrees: number; positionX: number; positionZ: number };
  card: {
    cornerRadius: number;
    curveRadius: number;
    edgePull: number;
    focusFloor: number;
    height: number;
    /** Feathered spread of the cast shadow beyond the card, `0` to `~0.9`. */
    shadowBlur: number;
    /** Straight-alpha shadow color; alpha `0` disables the shadow pass. */
    shadowColor: readonly [number, number, number, number];
    /** World-space shadow offset along X. */
    shadowOffsetX: number;
    /** World-space shadow offset along Y. */
    shadowOffsetY: number;
    width: number;
  };
  cards: readonly SpiralGlCard[];
  group: { position: Vector3; scale: number };
  viewTile?: Readonly<{
    column: number;
    columns: number;
    row: number;
    rows: number;
  }>;
};

/** Maps the normalized offset pad range (±1 per axis) to world units. */
export const spiralShadowOffsetScale = 0.6;

export type SpiralGlRenderer = {
  canvas: HTMLCanvasElement;
  createTexture: (
    dataUrl: string,
    options: { flipX: boolean; flipY: boolean; rotation: number },
  ) => SpiralGlTexture;
  dispose: () => void;
  render: (frame: SpiralGlFrame) => void;
  setSize: (width: number, height: number) => void;
};

function compileShader(
  gl: WebGLRenderingContext,
  kind: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(kind);
  if (!shader) throw new Error("Unable to create the Image Gallery WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create the Image Gallery WebGL program.");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown WebGL link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function multiplyInto(result: Matrix, left: Matrix, right: Matrix): void {
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let value = 0;
      for (let index = 0; index < 4; index += 1) {
        value += left[index * 4 + row]! * right[column * 4 + index]!;
      }
      result[column * 4 + row] = value;
    }
  }
}

function setTranslation(result: Matrix, x: number, y: number, z: number): void {
  result.set([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ]);
}

function setScale(result: Matrix, value: number): void {
  result.set([
    value, 0, 0, 0,
    0, value, 0, 0,
    0, 0, value, 0,
    0, 0, 0, 1,
  ]);
}

function setRotationX(result: Matrix, angle: number): void {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  result.set([
    1, 0, 0, 0,
    0, cosine, sine, 0,
    0, -sine, cosine, 0,
    0, 0, 0, 1,
  ]);
}

function setRotationY(result: Matrix, angle: number): void {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  result.set([
    cosine, 0, -sine, 0,
    0, 1, 0, 0,
    sine, 0, cosine, 0,
    0, 0, 0, 1,
  ]);
}

function setPerspective(
  result: Matrix,
  fovDegrees: number,
  aspect: number,
): void {
  const near = 0.1;
  const far = 80;
  const focalLength = 1 / Math.tan((fovDegrees * Math.PI) / 360);
  result.set([
    focalLength / Math.max(aspect, 0.0001), 0, 0, 0,
    0, focalLength, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ]);
}

function createPlaneGrid(): { indices: Uint16Array; vertices: Float32Array } {
  const columns = 18;
  const rows = 32;
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      vertices.push(u - 0.5, v - 0.5, 0, u, v);
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = row * (columns + 1) + column;
      const bottomLeft = (row + 1) * (columns + 1) + column;
      indices.push(
        topLeft,
        bottomLeft,
        topLeft + 1,
        topLeft + 1,
        bottomLeft,
        bottomLeft + 1,
      );
    }
  }
  return { indices: new Uint16Array(indices), vertices: new Float32Array(vertices) };
}

export function createSpiralGlRenderer(canvas: HTMLCanvasElement): SpiralGlRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    stencil: false,
  });
  if (!gl) throw new Error("Image Gallery requires WebGL support.");

  const program = createProgram(gl);
  const grid = createPlaneGrid();
  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  if (!vertexBuffer || !indexBuffer) {
    throw new Error("Unable to allocate Image Gallery geometry buffers.");
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, grid.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.indices, gl.STATIC_DRAW);

  const attribute = (name: string) => {
    const location = gl.getAttribLocation(program, name);
    if (location < 0) throw new Error(`Missing Image Gallery attribute ${name}.`);
    return location;
  };
  const uniform = (name: string) => {
    const location = gl.getUniformLocation(program, name);
    if (!location) throw new Error(`Missing Image Gallery uniform ${name}.`);
    return location;
  };
  const attributes = { position: attribute("aPosition"), uv: attribute("aUv") };
  const uniforms = {
    cardHeight: uniform("uCardHeight"),
    cardWidth: uniform("uCardWidth"),
    cornerRadius: uniform("uCornerRadius"),
    curveRadius: uniform("uCurveRadius"),
    edgePull: uniform("uEdgePull"),
    flipX: uniform("uFlipX"),
    flipY: uniform("uFlipY"),
    focus: uniform("uFocus"),
    focusFloor: uniform("uFocusFloor"),
    modelView: uniform("uModelViewMatrix"),
    opacity: uniform("uOpacity"),
    planeAspect: uniform("uPlaneAspect"),
    projection: uniform("uProjectionMatrix"),
    rotation: uniform("uRotation"),
    shadowColor: uniform("uShadowColor"),
    shadowInset: uniform("uShadowInset"),
    shadowPass: uniform("uShadowPass"),
    texture: uniform("uTexture"),
    textureAspect: uniform("uTextureAspect"),
  };

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.enableVertexAttribArray(attributes.position);
  gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(attributes.uv);
  gl.vertexAttribPointer(attributes.uv, 2, gl.FLOAT, false, 20, 12);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.uniform1i(uniforms.texture, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const textures = new Set<SpiralGlTexture>();
  const sortedCards: SpiralGlCard[] = [];
  const projectionMatrix = new Float32Array(16);
  const viewMatrix = new Float32Array(16);
  const groupTranslationMatrix = new Float32Array(16);
  const groupScaleMatrix = new Float32Array(16);
  const groupMatrix = new Float32Array(16);
  const cardRotationXMatrix = new Float32Array(16);
  const cardRotationYMatrix = new Float32Array(16);
  const cardRotationMatrix = new Float32Array(16);
  const cardTranslationMatrix = new Float32Array(16);
  const cardScaleMatrix = new Float32Array(16);
  const cardRotationScaleMatrix = new Float32Array(16);
  const cardLocalMatrix = new Float32Array(16);
  const modelMatrix = new Float32Array(16);
  const modelViewMatrix = new Float32Array(16);

  const createTexture: SpiralGlRenderer["createTexture"] = (dataUrl, options) => {
    const handle = gl.createTexture();
    if (!handle) throw new Error("Unable to allocate an Image Gallery texture.");
    gl.bindTexture(gl.TEXTURE_2D, handle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    let resolveReady = (): void => undefined;
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    const texture: SpiralGlTexture = {
      aspect: 0.78,
      dispose: () => {
        if (!textures.delete(texture)) return;
        gl.deleteTexture(handle);
      },
      flipX: options.flipX ? 1 : 0,
      flipY: options.flipY ? 1 : 0,
      handle,
      loaded: false,
      ready,
      rotation: options.rotation,
    };
    textures.add(texture);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const baseAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      texture.aspect = options.rotation % 2 === 1 ? 1 / baseAspect : baseAspect;
      gl.bindTexture(gl.TEXTURE_2D, handle);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      texture.loaded = true;
      resolveReady();
    };
    image.onerror = () => {
      texture.loaded = true;
      resolveReady();
    };
    image.src = dataUrl;
    return texture;
  };

  return {
    canvas,
    createTexture,
    dispose: () => {
      textures.forEach((texture) => texture.dispose());
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
    render: (frame) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      setPerspective(
        projectionMatrix,
        frame.camera.fovDegrees,
        frame.camera.aspect,
      );
      if (frame.viewTile) {
        const { column, columns, row, rows } = frame.viewTile;
        const offsetX = columns - column * 2 - 1;
        const offsetY = row * 2 + 1 - rows;
        for (const index of [0, 4, 8, 12]) {
          projectionMatrix[index] =
            projectionMatrix[index]! * columns +
            projectionMatrix[index + 3]! * offsetX;
        }
        for (const index of [1, 5, 9, 13]) {
          projectionMatrix[index] =
            projectionMatrix[index]! * rows +
            projectionMatrix[index + 2]! * offsetY;
        }
      }
      setTranslation(
        viewMatrix,
        -frame.camera.positionX,
        0,
        -frame.camera.positionZ,
      );
      setTranslation(groupTranslationMatrix, ...frame.group.position);
      setScale(groupScaleMatrix, frame.group.scale);
      multiplyInto(groupMatrix, groupTranslationMatrix, groupScaleMatrix);
      gl.uniformMatrix4fv(uniforms.projection, false, projectionMatrix);
      gl.uniform1f(uniforms.cardWidth, frame.card.width);
      gl.uniform1f(uniforms.cardHeight, frame.card.height);
      gl.uniform1f(uniforms.cornerRadius, frame.card.cornerRadius);
      gl.uniform1f(uniforms.focusFloor, frame.card.focusFloor);
      gl.uniform1f(uniforms.planeAspect, frame.card.width / frame.card.height);
      const shadowSpread = 1 + Math.max(0, frame.card.shadowBlur);
      const shadowEnabled = frame.card.shadowColor[3] > 0.001;
      gl.uniform1f(uniforms.shadowInset, 1 / shadowSpread);
      gl.uniform4f(
        uniforms.shadowColor,
        frame.card.shadowColor[0],
        frame.card.shadowColor[1],
        frame.card.shadowColor[2],
        frame.card.shadowColor[3],
      );
      sortedCards.length = 0;
      for (const card of frame.cards) {
        if (card.opacity > 0.001) sortedCards.push(card);
      }
      sortedCards.sort((left, right) => left.renderOrder - right.renderOrder);
      const uploadCardMatrix = (
        card: SpiralGlCard,
        offsetX: number,
        offsetY: number,
        offsetZ: number,
        scale: number,
      ) => {
        setTranslation(
          cardTranslationMatrix,
          card.position[0] + offsetX,
          card.position[1] + offsetY,
          card.position[2] + offsetZ,
        );
        setScale(cardScaleMatrix, scale);
        multiplyInto(
          cardRotationScaleMatrix,
          cardRotationMatrix,
          cardScaleMatrix,
        );
        multiplyInto(
          cardLocalMatrix,
          cardTranslationMatrix,
          cardRotationScaleMatrix,
        );
        multiplyInto(modelMatrix, groupMatrix, cardLocalMatrix);
        multiplyInto(modelViewMatrix, viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(uniforms.modelView, false, modelViewMatrix);
      };
      for (const card of sortedCards) {
        setRotationY(cardRotationYMatrix, card.rotationY);
        setRotationX(cardRotationXMatrix, card.rotationX);
        multiplyInto(
          cardRotationMatrix,
          cardRotationYMatrix,
          cardRotationXMatrix,
        );
        gl.uniform1f(uniforms.focus, card.focus);
        gl.uniform1f(uniforms.opacity, card.opacity);
        const flatten = Math.min(1, Math.max(0, card.flatten));
        gl.uniform1f(
          uniforms.curveRadius,
          frame.card.curveRadius / Math.max(0.08, 1 - flatten * 0.85),
        );
        gl.uniform1f(uniforms.edgePull, frame.card.edgePull * (1 - flatten));
        gl.uniform1f(uniforms.textureAspect, card.texture.aspect);
        gl.uniform1f(uniforms.flipX, card.texture.flipX);
        gl.uniform1f(uniforms.flipY, card.texture.flipY);
        gl.uniform1f(uniforms.rotation, card.texture.rotation);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, card.texture.handle);
        if (shadowEnabled) {
          // The cast shadow draws just before its card in the same painter's
          // order, so a front card's shadow falls on the cards behind it.
          gl.uniform1f(uniforms.shadowPass, 1);
          uploadCardMatrix(
            card,
            frame.card.shadowOffsetX,
            frame.card.shadowOffsetY,
            0,
            card.scale * shadowSpread,
          );
          gl.drawElements(
            gl.TRIANGLES,
            grid.indices.length,
            gl.UNSIGNED_SHORT,
            0,
          );
        }
        gl.uniform1f(uniforms.shadowPass, 0);
        uploadCardMatrix(card, 0, 0, 0, card.scale);
        gl.drawElements(gl.TRIANGLES, grid.indices.length, gl.UNSIGNED_SHORT, 0);
      }
    },
    setSize: (width, height) => {
      const nextWidth = Math.max(1, Math.round(width));
      const nextHeight = Math.max(1, Math.round(height));
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    },
  };
}
