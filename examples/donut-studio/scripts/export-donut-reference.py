"""Export the authored donut base/plate and a compact reference manifest.

Run with Blender:
  blender --background --python scripts/export-donut-reference.py -- \
    source.blend public/donut-studio/donut-reference.glb \
    public/donut-studio/reference-manifest.json
"""

from __future__ import annotations

import hashlib
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def rounded(value: float) -> float:
    return round(float(value), 8)


def vector(value) -> list[float]:
    return [rounded(component) for component in value]


def world_bounds(obj: bpy.types.Object) -> dict[str, list[float]]:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return {
        "min": [rounded(min(corner[axis] for corner in corners)) for axis in range(3)],
        "max": [rounded(max(corner[axis] for corner in corners)) for axis in range(3)],
    }


def evaluated_mesh_record(
    obj: bpy.types.Object,
    depsgraph: bpy.types.Depsgraph,
) -> dict[str, object]:
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh(preserve_all_data_layers=True, depsgraph=depsgraph)
    try:
        mesh.calc_loop_triangles()
        return {
            "name": obj.name,
            "vertices": len(mesh.vertices),
            "polygons": len(mesh.polygons),
            "triangles": len(mesh.loop_triangles),
            "bounds": world_bounds(evaluated),
            "matrixWorld": [
                [rounded(component) for component in row]
                for row in evaluated.matrix_world
            ],
        }
    finally:
        evaluated.to_mesh_clear()


def node_input(material_name: str, input_name: str) -> object:
    material = bpy.data.materials.get(material_name)
    if not material or not material.node_tree:
        return None
    node = next(
        (candidate for candidate in material.node_tree.nodes if candidate.type == "BSDF_PRINCIPLED"),
        None,
    )
    if not node or input_name not in node.inputs:
        return None
    value = node.inputs[input_name].default_value
    if hasattr(value, "__len__"):
        return vector(value)
    return rounded(value)


def modifier_input(object_name: str, input_name: str) -> object:
    obj = bpy.data.objects[object_name]
    modifier = next(mod for mod in obj.modifiers if mod.type == "NODES")
    interface_item = next(
        item
        for item in modifier.node_group.interface.items_tree
        if item.item_type == "SOCKET"
        and item.in_out == "INPUT"
        and item.name == input_name
    )
    value = modifier.get(interface_item.identifier, interface_item.default_value)
    if hasattr(value, "__len__") and not isinstance(value, str):
        return vector(value)
    if isinstance(value, float):
        return rounded(value)
    return value


def light_record(obj: bpy.types.Object) -> dict[str, object]:
    data = obj.data
    return {
        "name": obj.name,
        "type": data.type,
        "location": vector(obj.location),
        "rotationEuler": vector(obj.rotation_euler),
        "scale": vector(obj.scale),
        "color": vector(data.color),
        "energy": rounded(data.energy),
        "shape": data.shape,
        "size": rounded(data.size),
    }


def bake_selected_meshes(names: tuple[str, ...]) -> list[bpy.types.Object]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    baked: list[bpy.types.Object] = []
    for name in names:
        source = bpy.data.objects[name]
        evaluated = source.evaluated_get(depsgraph)
        mesh = bpy.data.meshes.new_from_object(
            evaluated,
            preserve_all_data_layers=True,
            depsgraph=depsgraph,
        )
        mesh.name = f"__{name}ReferenceMesh"
        mesh.materials.clear()
        target = bpy.data.objects.new(f"__{name}Reference", mesh)
        target.matrix_world = evaluated.matrix_world.copy()
        bpy.context.scene.collection.objects.link(target)
        baked.append(target)

    for obj in list(bpy.context.scene.objects):
        if obj not in baked:
            bpy.data.objects.remove(obj, do_unlink=True)

    for obj, name in zip(baked, names, strict=True):
        obj.name = name
        obj.data.name = f"{name}ReferenceMesh"
        obj.select_set(True)
    bpy.context.view_layer.objects.active = baked[0]
    return baked


def three_vector(value: Vector) -> tuple[float, float, float]:
    return (float(value.x), float(value.z), float(-value.y))


def write_runtime_geometry(
    names: tuple[str, ...],
    depsgraph: bpy.types.Depsgraph,
    output_path: Path,
) -> None:
    with output_path.open("wb") as output:
        output.write(b"DNT1")
        output.write(struct.pack("<I", len(names)))
        for name in names:
            source = bpy.data.objects[name]
            evaluated = source.evaluated_get(depsgraph)
            mesh = evaluated.to_mesh(
                preserve_all_data_layers=True,
                depsgraph=depsgraph,
            )
            try:
                mesh.calc_loop_triangles()
                encoded_name = name.encode("utf-8")
                output.write(struct.pack("<I", len(encoded_name)))
                output.write(encoded_name)
                output.write(b"\0" * ((-len(encoded_name)) % 4))
                output.write(
                    struct.pack(
                        "<II",
                        len(mesh.vertices),
                        len(mesh.loop_triangles) * 3,
                    )
                )
                normal_matrix = evaluated.matrix_world.to_3x3().inverted().transposed()
                for vertex in mesh.vertices:
                    output.write(
                        struct.pack(
                            "<3f",
                            *three_vector(evaluated.matrix_world @ vertex.co),
                        )
                    )
                for vertex in mesh.vertices:
                    world_normal = (normal_matrix @ vertex.normal).normalized()
                    output.write(struct.pack("<3f", *three_vector(world_normal)))
                for triangle in mesh.loop_triangles:
                    output.write(struct.pack("<3I", *triangle.vertices))
            finally:
                evaluated.to_mesh_clear()


def convert_environment_to_png(
    source_path: Path,
    output_path: Path,
    scene: bpy.types.Scene,
) -> None:
    image = bpy.data.images.load(str(source_path), check_existing=False)
    try:
        image.save_render(str(output_path), scene=scene)
    finally:
        bpy.data.images.remove(image)


def main() -> None:
    try:
        separator = sys.argv.index("--")
        (
            source_path,
            glb_path,
            manifest_path,
            runtime_geometry_path,
            environment_source_path,
            environment_png_path,
        ) = map(
            Path,
            sys.argv[separator + 1 : separator + 7],
        )
    except (ValueError, IndexError):
        raise SystemExit(
            "Expected: -- <source.blend> <output.glb> <manifest.json> "
            "<runtime.bin> <environment.hdr> <environment.png>",
        )

    source_path = source_path.expanduser().resolve()
    glb_path = glb_path.expanduser().resolve()
    manifest_path = manifest_path.expanduser().resolve()
    runtime_geometry_path = runtime_geometry_path.expanduser().resolve()
    environment_source_path = environment_source_path.expanduser().resolve()
    environment_png_path = environment_png_path.expanduser().resolve()
    glb_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    runtime_geometry_path.parent.mkdir(parents=True, exist_ok=True)
    environment_png_path.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.open_mainfile(filepath=str(source_path))
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()

    mesh_records = [
        evaluated_mesh_record(bpy.data.objects[name], depsgraph)
        for name in ("Base", "Plate")
    ]
    manifest = {
        "schemaVersion": 1,
        "source": {
            "fileName": source_path.name,
            "byteLength": source_path.stat().st_size,
            "sha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
            "blenderFileVersion": list(bpy.data.version),
            "exportBlenderVersion": bpy.app.version_string,
        },
        "scene": {
            "engine": scene.render.engine,
            "resolution": [scene.render.resolution_x, scene.render.resolution_y],
            "fps": scene.render.fps,
            "frameRange": [scene.frame_start, scene.frame_end],
            "camera": scene.camera.name if scene.camera else None,
            "colorManagement": {
                "displayDevice": scene.display_settings.display_device,
                "viewTransform": scene.view_settings.view_transform,
                "look": scene.view_settings.look,
                "exposure": rounded(scene.view_settings.exposure),
                "gamma": rounded(scene.view_settings.gamma),
            },
        },
        "meshes": mesh_records,
        "geometryNodes": {
            "groups": {
                name: {
                    "nodeCount": len(bpy.data.node_groups[name].nodes),
                    "linkCount": len(bpy.data.node_groups[name].links),
                }
                for name in (
                    "icing",
                    "Main group",
                    "Sprinkle",
                    "sprinkle instance",
                    "Subtractive mix",
                )
            },
            "icing": {
                "colourLinear": modifier_input("Icing", "Colour"),
                "enable": modifier_input("Icing", "Enable"),
                "clearBase": modifier_input("Icing", "Clear Base"),
                "clearDetail": modifier_input("Icing", "Clear Detail"),
            },
            "sprinkle": {
                "flow": modifier_input("Sprinkle", "Flow"),
                "scale": modifier_input("Sprinkle", "Scale"),
                "shapeType": modifier_input("Sprinkle", "Shape Type"),
                "colourType": modifier_input("Sprinkle", "Colour Type"),
                "metallic": modifier_input("Sprinkle", "Metallic"),
                "solidColourLinear": modifier_input("Sprinkle", "Solid Colour"),
                "clear": modifier_input("Sprinkle", "Clear"),
            },
        },
        "materials": {
            "donut": {
                "source": "Material",
                "baseColorLinear": node_input("Material", "Base Color"),
                "roughness": node_input("Material", "Roughness"),
                "ior": node_input("Material", "IOR"),
                "subsurfaceWeight": node_input("Material", "Subsurface Weight"),
                "subsurfaceScale": node_input("Material", "Subsurface Scale"),
                "coatWeight": node_input("Material", "Coat Weight"),
                "sheenWeight": node_input("Material", "Sheen Weight"),
            },
            "icing": {
                "source": "icing",
                "baseColorLinear": node_input("icing", "Base Color"),
                "roughness": node_input("icing", "Roughness"),
                "ior": node_input("icing", "IOR"),
                "subsurfaceWeight": node_input("icing", "Subsurface Weight"),
                "subsurfaceScale": node_input("icing", "Subsurface Scale"),
                "coatWeight": node_input("icing", "Coat Weight"),
                "sheenWeight": node_input("icing", "Sheen Weight"),
            },
            "plate": {
                "source": "Material.002",
                "baseColorLinear": node_input("Material.002", "Base Color"),
                "roughness": node_input("Material.002", "Roughness"),
                "ior": node_input("Material.002", "IOR"),
            },
            "sprinkle": {
                "source": "sprinkle",
                "baseColorLinear": node_input("sprinkle", "Base Color"),
                "roughness": node_input("sprinkle", "Roughness"),
                "ior": node_input("sprinkle", "IOR"),
                "metallicDriver": "Sprinkle.GeometryNodes.Metallic",
                "colourDriver": "Sprinkle.GeometryNodes.Colour Type",
            },
        },
        "lights": [
            light_record(bpy.data.objects[name])
            for name in ("Area", "Area.001", "Area.002")
        ],
        "world": {
            "environment": "brown_photostudio_02",
            "environmentRotationRadians": rounded(math.pi / 2),
            "environmentStrength": 0.25,
            "cameraRayColorLinear": [0.17694668, 0.48189244, 0.909513, 1.0],
            "cameraRayStrength": 1.92,
        },
        "referenceTimeline": "none",
    }

    write_runtime_geometry(("Base", "Plate"), depsgraph, runtime_geometry_path)
    convert_environment_to_png(
        environment_source_path,
        environment_png_path,
        scene,
    )
    bake_selected_meshes(("Base", "Plate"))
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        export_apply=False,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_materials="NONE",
        export_yup=True,
        use_selection=True,
    )

    manifest["asset"] = {
        "fileName": glb_path.name,
        "byteLength": glb_path.stat().st_size,
        "sha256": hashlib.sha256(glb_path.read_bytes()).hexdigest(),
    }
    manifest["runtimeGeometry"] = {
        "fileName": runtime_geometry_path.name,
        "byteLength": runtime_geometry_path.stat().st_size,
        "sha256": hashlib.sha256(runtime_geometry_path.read_bytes()).hexdigest(),
    }
    manifest["environmentPreview"] = {
        "fileName": environment_png_path.name,
        "byteLength": environment_png_path.stat().st_size,
        "sha256": hashlib.sha256(environment_png_path.read_bytes()).hexdigest(),
        "sourceFileName": environment_source_path.name,
        "sourceSha256": hashlib.sha256(
            environment_source_path.read_bytes(),
        ).hexdigest(),
    }
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
