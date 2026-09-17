import { downloadToolcraftSettings } from '@/toolcraft/runtime/react/app-shell/settings-transfer';
import type { ToolcraftPanelActionHandler } from '@/toolcraft/runtime/react';

export const icebergSettingsExportActionValue = 'export-settings';
export const icebergSettingsExportTarget = 'iceberg.settingsExport';

export const handleIcebergPanelAction: ToolcraftPanelActionHandler = ({ action, state }) => {
  if (action.value !== icebergSettingsExportActionValue) return;
  downloadToolcraftSettings(state);
};
