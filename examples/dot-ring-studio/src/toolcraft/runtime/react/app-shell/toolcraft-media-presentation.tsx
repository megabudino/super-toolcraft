"use client";

import * as React from "react";

import type { ToolcraftSourceAssetPresentationResources } from "../../source-assets/source-asset-presentation-resources";
import type { ToolcraftMediaAsset } from "../../state/types";

const ToolcraftMediaPresentationResourcesContext =
  React.createContext<ToolcraftSourceAssetPresentationResources | null>(null);
const ToolcraftMediaBootstrapUrlsContext = React.createContext<
  ReadonlyMap<string, string>
>(new Map());

export function ToolcraftMediaPresentationProvider({
  bootstrapUrls,
  children,
  resources,
}: {
  bootstrapUrls: ReadonlyMap<string, string>;
  children: React.ReactNode;
  resources: ToolcraftSourceAssetPresentationResources | null;
}): React.JSX.Element {
  return (
    <ToolcraftMediaBootstrapUrlsContext.Provider value={bootstrapUrls}>
      <ToolcraftMediaPresentationResourcesContext.Provider value={resources}>
        {children}
      </ToolcraftMediaPresentationResourcesContext.Provider>
    </ToolcraftMediaBootstrapUrlsContext.Provider>
  );
}

type BinaryPresentationAsset = {
  id: string;
  mimeType: string;
  resourceRef: string;
};

function getBinaryPresentationAssets(
  mediaAssets: readonly ToolcraftMediaAsset[],
): BinaryPresentationAsset[] {
  return mediaAssets.flatMap((asset) =>
    asset.assetKind === "model" || asset.lifecycle === "unavailable"
      ? []
      : [{
          id: asset.id,
          mimeType: asset.mimeType,
          resourceRef: asset.resourceRef,
        }],
  );
}

export function useToolcraftMediaPresentationUrls(
  mediaAssets: readonly ToolcraftMediaAsset[],
): ReadonlyMap<string, string> {
  const resources = React.useContext(ToolcraftMediaPresentationResourcesContext);
  const bootstrapUrls = React.useContext(ToolcraftMediaBootstrapUrlsContext);
  const [urls, setUrls] = React.useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );
  const binaryAssets = React.useMemo(
    () => getBinaryPresentationAssets(mediaAssets),
    [mediaAssets],
  );

  React.useEffect(() => {
    if (!resources) {
      setUrls(new Map());
      return undefined;
    }

    let active = true;
    const releases: Array<() => void> = [];
    void Promise.all(
      binaryAssets.map(async (asset) => {
        try {
          const handle = await resources.retain(
            asset.resourceRef,
            asset.mimeType,
          );

          if (!active) {
            handle.release();
            return null;
          }

          releases.push(handle.release);
          return [asset.id, handle.url] as const;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (active) {
        setUrls(new Map(entries.filter((entry) => entry !== null)));
      }
    });

    return () => {
      active = false;
      for (const release of releases) {
        release();
      }
    };
  }, [binaryAssets, resources]);

  return React.useMemo(() => {
    const presentedUrls = new Map<string, string>();

    for (const asset of binaryAssets) {
      const url = urls.get(asset.id) ?? bootstrapUrls.get(asset.resourceRef);

      if (url) {
        presentedUrls.set(asset.id, url);
      }
    }

    return presentedUrls;
  }, [binaryAssets, bootstrapUrls, urls]);
}
