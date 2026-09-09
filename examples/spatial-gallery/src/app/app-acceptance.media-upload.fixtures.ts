import { defineToolcraft } from "@/toolcraft/runtime";

import type {
  ToolcraftComponentAcceptance,
  ToolcraftMediaLifecycleCoverage,
  ToolcraftModelImportCoverage,
} from "./acceptance/types";

type FileDropSchemaOptions = {
  withDefaultAsset?: boolean;
};

type FileDropAcceptanceOptions = {
  automatedTestName: string;
  browserTestName: string;
  expectedObservable: string;
  fixture: string;
  id?: string;
  mediaLifecycleCoverage?: readonly ToolcraftMediaLifecycleCoverage[];
  modelImportCoverage?:
    | "all-required-model-import-behavior"
    | readonly ToolcraftModelImportCoverage[];
  target?: string;
  userAction: string;
};

export function createSingleFileDropSchema({
  withDefaultAsset = false,
}: FileDropSchemaOptions = {}) {
  return defineToolcraft({
    canvas: { enabled: true, upload: withDefaultAsset },
    media: withDefaultAsset
      ? {
          defaultAssets: [
            {
              dataUrl: "data:image/png;base64,AAAA",
              fileName: "default-source.png",
              sourceTarget: "media.source",
            },
          ],
        }
      : undefined,
    panels: {
      controls: {
        sections: [
          {
            controls: {
              source: {
                defaultValue: null,
                label: "Source image",
                target: "media.source",
                type: "fileDrop",
              },
            },
            title: "Source",
          },
        ],
        title: "Controls",
      },
    },
  });
}

export function createMultipleFileDropSchema() {
  return defineToolcraft({
    canvas: { enabled: true },
    panels: {
      controls: {
        sections: [
          {
            controls: {
              sources: {
                defaultValue: [],
                label: "Source images",
                multiple: true,
                target: "media.sources",
                type: "fileDrop",
              },
            },
            title: "Source",
          },
        ],
        title: "Controls",
      },
    },
  });
}

export function createModelFileDropSchema() {
  return defineToolcraft({
    canvas: { enabled: true },
    panels: {
      controls: {
        sections: [
          {
            controls: {
              model: {
                assetKind: "model",
                defaultValue: null,
                label: "Model",
                target: "media.model",
                type: "fileDrop",
              },
            },
            title: "Model",
          },
        ],
        title: "Controls",
      },
    },
  });
}

export function createFileDropAcceptance({
  automatedTestName,
  browserTestName,
  expectedObservable,
  fixture,
  id = "media.source",
  mediaLifecycleCoverage,
  modelImportCoverage,
  target = id,
  userAction,
}: FileDropAcceptanceOptions): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName,
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable,
    fixture,
    id,
    kind: "control",
    mediaLifecycleCoverage,
    modelImportCoverage,
    target,
    userAction,
  };
}
