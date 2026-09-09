import { afterEach, expect, it, vi } from "vitest";
import { ingestHeroGalleryMedia, getHeroGalleryMediaEntry, releaseHeroGalleryMedia } from "@/section/components/pages/home/hero-gallery-media-store";
import { resolveHeroGalleryRowSources, resolveHeroGallerySources } from "@/section/components/pages/home/hero-gallery-sources";
import { defaultHeroSceneSettings } from "@/section/components/pages/home/hero-scene-settings";

afterEach(() => { releaseHeroGalleryMedia(["test:portrait"]); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("releases a native source bitmap and its temporary URL when runtime media is removed", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 300, height: 400, close }));
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-portrait");
  ingestHeroGalleryMedia([{ ref: "test:portrait", id: "portrait", mimeType: "image/png", blob: new Blob(["portrait"]) }]);
  await vi.waitFor(() => expect(getHeroGalleryMediaEntry("test:portrait")?.status).toBe("ready"));
  releaseHeroGalleryMedia(["test:portrait"]);
  expect(getHeroGalleryMediaEntry("test:portrait")).toBeUndefined();
  expect(close).toHaveBeenCalledOnce();
  expect(revoke).toHaveBeenCalledWith("blob:test-portrait");
});

it("keeps removed row and gallery images empty without resurrecting authored defaults", () => {
  expect(resolveHeroGallerySources(defaultHeroSceneSettings.gallery)).toEqual([]);
  expect(resolveHeroGalleryRowSources(defaultHeroSceneSettings.gallery).flat()).toEqual([]);
});
