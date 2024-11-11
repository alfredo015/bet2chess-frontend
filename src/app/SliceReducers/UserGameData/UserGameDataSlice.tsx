import { createSlice } from "@reduxjs/toolkit";

interface UserGameDataI {
    userAddress: string | null,
    userName: string | null,
    userId: number | null
}

const initialState: UserGameDataI = {
    userAddress: null,
    userName: null,
    userId: null
};

export const userGameDataSlice = createSlice({
    name: "userGameData",
    initialState,
    reducers: {
        setUserAddress: (state, userAddress: {
            payload: string | null,
            type: string
        }) => {
            state.userAddress = userAddress.payload;
        },
        setUserName: (state, userName: {
            payload: string | null,
            type: string
        }) => {
            state.userName = userName.payload;
        },
        setUserId: (state, userId: {
            payload: number | null,
            type: string
        }) => {
            state.userId = userId.payload;
        },
        deleteAllUserGameData: (state) => {
            state.userAddress = null;
            state.userName = null;
            state.userId = null;
        }
    }
});

export const {
    setUserAddress,
    setUserName,
    setUserId,
    deleteAllUserGameData
} = userGameDataSlice.actions;

export default userGameDataSlice.reducer;