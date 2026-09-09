import { useEffect } from 'react';
import { useToolcraftDispatch, useToolcraftValue } from '@/toolcraft/runtime/react';
import { STUDIO_ROOM_DEFAULTS, STUDIO_ROOM_WALL_FILL_REVISION_TARGET, studioRoomTargets } from './studio-room-values';

/** Upgrade only the previous default, once per saved workspace. */
export function useStudioRoomWallFillDefault() {
  const dispatch = useToolcraftDispatch();
  const revision = useToolcraftValue(STUDIO_ROOM_WALL_FILL_REVISION_TARGET);
  const wallFill = useToolcraftValue(studioRoomTargets.roomWallFill);
  useEffect(() => {
    if (revision === 1) return;
    if (wallFill === '#F1F6DE') {
      dispatch({ type: 'controls.setValue', target: studioRoomTargets.roomWallFill,
        value: STUDIO_ROOM_DEFAULTS.room.wallFill, history: 'skip' });
    }
    dispatch({ type: 'controls.setValue', target: STUDIO_ROOM_WALL_FILL_REVISION_TARGET,
      value: 1, history: 'skip' });
  }, [dispatch, revision, wallFill]);
}
