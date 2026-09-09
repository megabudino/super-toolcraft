import {
  BoxGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Texture,
} from "three";
import { describe, expect, it, vi } from "vitest";

import {
  createDonutProductGraph,
  type DonutProductGraph,
} from "./donut-scene-graph";
import { DONUT_DEFAULTS } from "./donut-values";

function referenceRoot(): Group {
  const root = new Group();
  const base = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  base.name = "Base";
  const plate = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  plate.name = "Plate";
  root.add(base, plate);
  return root;
}

function createGraph(): DonutProductGraph {
  return createDonutProductGraph(referenceRoot(), DONUT_DEFAULTS, {
    baseColor: new Texture(),
    normal: new Texture(),
    roughness: new Texture(),
  });
}

describe("donut retained product graph", () => {
  it("binds authored meshes and all reusable procedural resources", () => {
    const graph = createGraph();
    expect(graph.base.name).toBe("Base");
    expect(graph.plate.name).toBe("Plate");
    expect(graph.icing.name).toBe("Icing");
    expect(graph.sprinkleMeshes).toHaveLength(3);
    expect(graph.sprinkleMeshes.map((mesh) => mesh.name)).toEqual([
      "Sprinkles.Pellet",
      "Sprinkles.Pearl",
      "Sprinkles.Rod",
    ]);
    expect(graph.getEvidence()).toMatchObject({
      icingVisible: true,
      plateVisible: true,
      sprinkleCount: 525,
      sprinkleShape: 3,
    });
  });

  it("updates visible source controls without replacing the graph", () => {
    const graph = createGraph();
    const root = graph.root;
    graph.updateSettings({
      ...DONUT_DEFAULTS,
      icing: {
        ...DONUT_DEFAULTS.icing,
        clearMode: "base",
        color: "#123456",
      },
      plateVisible: false,
      sprinkles: {
        ...DONUT_DEFAULTS.sprinkles,
        flow: 0.2,
        metallic: 0.75,
        palette: 1,
        shape: 1,
        solidColor: "#654321",
      },
    });

    expect(graph.root).toBe(root);
    expect(graph.plate.visible).toBe(false);
    expect(graph.icing.visible).toBe(false);
    expect(graph.materials.icing.color.getHexString()).toBe("123456");
    expect(graph.materials.sprinkle.metalness).toBe(0.75);
    expect(graph.getEvidence()).toMatchObject({
      icingVisible: false,
      plateVisible: false,
      sprinkleCount: 84,
      sprinkleShape: 1,
    });
  });

  it("uses distinct base/detail clear geometry", () => {
    const graph = createGraph();
    const detailed = graph.icing.geometry;
    graph.updateSettings({
      ...DONUT_DEFAULTS,
      icing: { ...DONUT_DEFAULTS.icing, clearMode: "detail" },
    });
    expect(graph.icing.visible).toBe(true);
    expect(graph.icing.geometry).not.toBe(detailed);
  });

  it("rebuilds sprinkle contact when flow changes the icing surface", () => {
    const graph = createGraph();
    const activeSprinkles =
      graph.sprinkleMeshes[DONUT_DEFAULTS.sprinkles.shape - 1]!;
    const readMatrices = () =>
      Array.from(
        { length: graph.getEvidence().sprinkleCount },
        (_, index) => {
          const matrix = new Matrix4();
          activeSprinkles.getMatrixAt(index, matrix);
          return [...matrix.elements];
        },
      );
    const before = readMatrices();

    graph.updateSettings({
      ...DONUT_DEFAULTS,
      icing: {
        ...DONUT_DEFAULTS.icing,
        dripAmount: 2,
        flow: 2,
      },
    });
    expect(readMatrices()).not.toEqual(before);
  });

  it("disposes retained geometry and materials exactly once", () => {
    const graph = createGraph();
    const disposables = [
      graph.base.geometry,
      graph.plate.geometry,
      graph.icing.geometry,
      ...graph.sprinkleMeshes.map((mesh) => mesh.geometry),
      ...Object.values(graph.materials),
    ];
    const spies = disposables.map((value) => vi.spyOn(value, "dispose"));
    graph.dispose();
    graph.dispose();
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  });

  it("rejects a GLB without the required authored objects", () => {
    expect(() =>
      createDonutProductGraph(new Group(), DONUT_DEFAULTS, {
        baseColor: new Texture(),
        normal: new Texture(),
        roughness: new Texture(),
      }),
    ).toThrow(/Base.*Plate/);
  });
});
