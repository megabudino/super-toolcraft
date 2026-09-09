import {
  CapsuleGeometry,
  Color,
  DodecahedronGeometry,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  SphereGeometry,
  Vector3,
  type Object3D,
} from "three";

import { createDonutBaseGeometryController } from "./donut-base-geometry";
import type { DonutFoodTextures } from "./donut-food-shader";
import {
  createDonutIcingGeometry,
  createDonutIcingSurfaceSignature,
} from "./donut-icing-geometry";
import {
  createDonutMaterials,
  disposeMaterial,
  type DonutMaterials,
  updateDonutMaterials,
} from "./donut-materials";
import { DONUT_GEOMETRY } from "./donut-reference";
import { createDonutSprinkleLayout } from "./donut-sprinkle-layout";
import type { DonutSettings } from "./donut-types";

export type DonutGraphEvidence = Readonly<{
  icingVisible: boolean;
  outputSignature: string;
  plateVisible: boolean;
  sprinkleCount: number;
  sprinkleShape: number;
}>;

export type DonutProductGraph = Readonly<{
  base: Mesh;
  dispose: () => void;
  getEvidence: () => DonutGraphEvidence;
  icing: Mesh;
  materials: DonutMaterials;
  plate: Mesh;
  root: Group;
  sprinkleMeshes: readonly InstancedMesh[];
  updateSettings: (settings: DonutSettings) => void;
}>;

function findMesh(root: Object3D, name: string): Mesh | null {
  const object = root.getObjectByName(name);
  return object instanceof Mesh ? object : null;
}

function replaceMaterial(
  mesh: Mesh,
  material: DonutMaterials[keyof DonutMaterials],
) {
  disposeMaterial(mesh.material);
  mesh.material = material;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createSprinkleMeshes(material: DonutMaterials["sprinkle"]) {
  const geometries = [
    new DodecahedronGeometry(0.5, 0),
    new SphereGeometry(0.5, 14, 10),
    new CapsuleGeometry(0.5, 0.5, 6, 10),
  ] as const;
  const names = [
    "Sprinkles.Pellet",
    "Sprinkles.Pearl",
    "Sprinkles.Rod",
  ] as const;
  return geometries.map((geometry, index) => {
    const mesh = new InstancedMesh(
      geometry,
      material,
      DONUT_GEOMETRY.sprinkleMaxCount,
    );
    mesh.name = names[index]!;
    mesh.count = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    return mesh;
  });
}

function hashSignature(settings: DonutSettings, count: number): string {
  const source = JSON.stringify({ count, settings });
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(16).padStart(8, "0")}:${count}`;
}

function icingGeometryKey(settings: DonutSettings): string {
  return createDonutIcingSurfaceSignature({
    detail: settings.icing.clearMode !== "detail",
    donut: settings.donut,
    icing: settings.icing,
  });
}

function sprinkleLayoutKey(settings: DonutSettings): string {
  return JSON.stringify({
    icingSurface: icingGeometryKey(settings),
    sprinkles: settings.sprinkles,
  });
}

export function createDonutProductGraph(
  referenceRoot: Group,
  initialSettings: DonutSettings,
  foodTextures: DonutFoodTextures,
): DonutProductGraph {
  const base = findMesh(referenceRoot, "Base");
  const plate = findMesh(referenceRoot, "Plate");
  if (!base || !plate) {
    throw new Error(
      "The Blender-derived donut asset must contain mesh objects Base and Plate.",
    );
  }

  const root = new Group();
  root.name = "Donut.ProductRoot";
  root.add(referenceRoot);

  const materials = createDonutMaterials(initialSettings, foodTextures);
  replaceMaterial(base, materials.base);
  replaceMaterial(plate, materials.plate);
  const baseController = createDonutBaseGeometryController(base.geometry);
  baseController.update(initialSettings.donut);

  let icingGeometry = createDonutIcingGeometry({
    detail: initialSettings.icing.clearMode !== "detail",
    donut: initialSettings.donut,
    icing: initialSettings.icing,
  });
  const icing = new Mesh(icingGeometry, materials.icing);
  icing.name = "Icing";
  icing.castShadow = true;
  icing.receiveShadow = true;
  root.add(icing);

  const sprinkleMeshes = createSprinkleMeshes(materials.sprinkle);
  root.add(...sprinkleMeshes);

  let disposed = false;
  let settings = initialSettings;
  let baseKey = "";
  let icingKey = "";
  let layoutKey = "";
  let sprinkleCount = 0;

  const updateSprinkles = (nextSettings: DonutSettings): void => {
    const nextLayoutKey = sprinkleLayoutKey(nextSettings);
    if (nextLayoutKey === layoutKey) return;
    layoutKey = nextLayoutKey;
    const layout = createDonutSprinkleLayout(nextSettings);
    sprinkleCount = layout.length;
    const activeIndex = nextSettings.sprinkles.shape - 1;
    const matrix = new Matrix4();
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    const instanceColor = new Color();

    for (let meshIndex = 0; meshIndex < sprinkleMeshes.length; meshIndex += 1) {
      const mesh = sprinkleMeshes[meshIndex]!;
      const active = meshIndex === activeIndex;
      mesh.count = active ? layout.length : 0;
      mesh.visible = active && layout.length > 0;
      if (!active) continue;
      for (const instance of layout) {
        position.fromArray(instance.position);
        quaternion.fromArray(instance.quaternion);
        scale.fromArray(instance.scale);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(instance.index, matrix);
        mesh.setColorAt(instance.index, instanceColor.set(instance.color));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  };

  const updateSettings = (nextSettings: DonutSettings): void => {
    if (disposed) return;
    settings = nextSettings;
    plate.visible = settings.plateVisible;
    icing.visible =
      settings.icing.enabled && settings.icing.clearMode !== "base";

    const nextBaseKey = JSON.stringify(settings.donut);
    if (nextBaseKey !== baseKey) {
      baseKey = nextBaseKey;
      baseController.update(settings.donut);
    }

    const nextIcingKey = icingGeometryKey(settings);
    if (nextIcingKey !== icingKey) {
      icingKey = nextIcingKey;
      const nextGeometry = createDonutIcingGeometry({
        detail: settings.icing.clearMode !== "detail",
        donut: settings.donut,
        icing: settings.icing,
      });
      icing.geometry = nextGeometry;
      icingGeometry.dispose();
      icingGeometry = nextGeometry;
    }

    updateDonutMaterials(materials, settings);
    updateSprinkles(settings);
  };

  updateSettings(initialSettings);

  return Object.freeze({
    base,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      icingGeometry.dispose();
      base.geometry.dispose();
      plate.geometry.dispose();
      for (const mesh of sprinkleMeshes) mesh.geometry.dispose();
      for (const material of Object.values(materials)) material.dispose();
      root.clear();
    },
    getEvidence: () =>
      Object.freeze({
        icingVisible: icing.visible,
        outputSignature: hashSignature(settings, sprinkleCount),
        plateVisible: plate.visible,
        sprinkleCount,
        sprinkleShape: settings.sprinkles.shape,
      }),
    icing,
    materials,
    plate,
    root,
    sprinkleMeshes,
    updateSettings,
  });
}
