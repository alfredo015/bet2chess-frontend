import { configureStore } from '@reduxjs/toolkit'; 
import AccountSettigsSlice from "../SliceReducers/AppGlobalData/AppGlobalDataSlice";
import UserGameDataSlice from "../SliceReducers/UserGameData/UserGameDataSlice";


export const store = configureStore({
    reducer: {
        AccountsSettings: AccountSettigsSlice,
        UserGameData: UserGameDataSlice
    }
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {counter: counterState}
export type AppDispatch = typeof store.dispatch;
