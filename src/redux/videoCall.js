/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

export const videoCall = createSlice({
  name: 'videoCall',
  initialState: {
    videoCallModal: false,
    videoCallData: null,
    chatCount: 0,
  },
  reducers: {
    setVideoCallModal(state, action) {
      state.videoCallModal = action.payload;
    },
    setChatCount(state, action) {
      state.chatCount = action.payload;
    },
  },
});

export const {
  setVideoCallData, setChatCount, setVideoCallModal,
} = videoCall.actions;

export default videoCall.reducer;
