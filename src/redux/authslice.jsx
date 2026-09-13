import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loggedInUserData: null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setLoginUser: (state, action) => {
      state.loggedInUserData = action.payload;
    },

    logoutUser: (state) => {
      state.loggedInUserData = null;
    },
  },
});

export const { setLoginUser, logoutUser } = authSlice.actions;

export default authSlice.reducer;