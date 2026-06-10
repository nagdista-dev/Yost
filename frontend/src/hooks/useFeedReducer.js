import { useReducer, useMemo } from 'react';

function feedReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START': {
      const activeKeys = new Set(action.activeHandles.map(h => h.replace('@', '').toLowerCase()));
      const cleanedData = {};
      Object.entries(state.channelData).forEach(([channel, data]) => {
        const cleanC = channel.replace('@', '').toLowerCase();
        if (activeKeys.has(cleanC)) {
          cleanedData[channel] = data;
        }
      });
      return { ...state, channelData: cleanedData, loading: true };
    }
    case 'FETCH_CHANNEL_DONE':
      return {
        ...state,
        channelData: {
          ...state.channelData,
          [action.channel]: action.data,
        },
      };
    case 'FETCH_ALL_DONE':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export default function useFeedReducer(channels, postCacheRef, getPostCache) {
  const initialState = useMemo(() => {
    if (channels.length === 0) return { channelData: {}, loading: false };
    const seeded = {};
    let anySeeded = false;
    channels.forEach(ch => {
      const handle = (typeof ch === 'string' ? ch : ch.handle).replace('@', '').toLowerCase();
      const entry = getPostCache(handle, postCacheRef.current);
      if (entry) {
        seeded[entry.handle] = entry.data;
        anySeeded = true;
      }
    });
    return { channelData: seeded, loading: !anySeeded };
  }, []);

  return useReducer(feedReducer, initialState);
}
