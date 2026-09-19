"use client";

import * as React from "react";
import { DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button, ControlList, PanelActions } from "@/toolcraft/ui";
import { SaveAppDefaults } from "./controls-panel-save-defaults";
import type { ToolcraftState } from "../../../state/types";
import {
  downloadToolcraftSettings,
  importToolcraftSettings,
} from "../../app-shell/settings-transfer";
import { useSettingsTransferActivity } from "../../app-shell/settings-transfer-activity";
import { ToolcraftSourceAssetCoordinatorContext } from "../../app-shell/toolcraft-source-asset-context";
import { useToolcraftDispatch } from "../../app-shell/use-toolcraft";
import {
  ToolcraftSharedValuesContext,
  useToolcraftSharedControlsDisabled,
} from "../../external-document/shared-values-context";

export type SettingsTransferControlRenderArgs = {
  getState: () => ToolcraftState;
  id: string;
};

function SettingsTransferControl({
  getState,
}: Pick<SettingsTransferControlRenderArgs, "getState">) {
  const dispatch = useToolcraftDispatch();
  const sourceAssetCoordinator = React.useContext(ToolcraftSourceAssetCoordinatorContext);
  const shared = React.useContext(ToolcraftSharedValuesContext);
  const readOnly = useToolcraftSharedControlsDisabled(shared?.targets ?? []);
  const { operation } = useSettingsTransferActivity(getState);
  return (
    <ControlList>
      <SaveAppDefaults getState={getState} disabled={readOnly} />
      <PanelActions columns={2}>
        <Button
          type="button"
          variant="outline"
          disabled={operation !== null || readOnly}
          loading={operation === "import"}
          onClick={() => {
            void importToolcraftSettings({
              getState,
              sourceAssetCoordinator: sourceAssetCoordinator ?? {},
              dispatch(command) {
                // Admission may change while the file picker or resource reads are open.
                if (shared && !shared.getSnapshot().editable)
                  throw new Error("The website is not ready to import settings.");
                dispatch(command);
              },
            });
          }}
        >
          <DownloadSimpleIcon aria-hidden="true" data-icon="inline-start" data-icon-name="download-simple" />
          Import Settings
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={operation !== null || readOnly}
          onClick={() => downloadToolcraftSettings(getState())}
        >
          <UploadSimpleIcon aria-hidden="true" data-icon="inline-start" data-icon-name="upload-simple" />
          Export Settings
        </Button>
      </PanelActions>
    </ControlList>
  );
}

export function renderSettingsTransferControl({
  getState,
  id,
}: SettingsTransferControlRenderArgs): React.ReactNode {
  return <SettingsTransferControl key={id} getState={getState} />;
}
