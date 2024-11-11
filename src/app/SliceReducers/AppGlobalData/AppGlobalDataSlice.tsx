import { createSlice } from "@reduxjs/toolkit";
import { Account } from "@gear-js/react-hooks";
import { HexString } from "@gear-js/api";

interface AppGlobalDataI {
    apiStarted: boolean,
    apiIsBusy: boolean,
    apiIsDisconnected: boolean,
    polkadotEnable: boolean,
    gaslessIsActive: boolean,
    showGaslessSwitch: boolean,
    signlessAddress: HexString | null,
    noWalletEncryptedName: string | null,
}

const initialState: AppGlobalDataI = {
    apiStarted: false, 
    apiIsBusy: false,
    apiIsDisconnected: true,    
    polkadotEnable: false, 
    signlessAddress: null,
    showGaslessSwitch: true,
    noWalletEncryptedName: null,
    gaslessIsActive: false
}

export const accountSettingsSlice = createSlice({
    name: 'accountSettings',
    initialState,
    reducers: {
        gearApiStarted: (state, apiStarted: {
            payload: boolean,
            type: string
        }) => {
            state.apiStarted = apiStarted.payload;
        },
        apiIsBusy: (state, apiIsBusy: {
            payload: boolean,
            type: string
        }) => {
            state.apiIsBusy = apiIsBusy.payload;
        },
        apiIsDisconnected: (state, apiIsDisconnected: {
            payload: boolean,
            type: string
        }) => {
            state.apiIsDisconnected = apiIsDisconnected.payload;
        },
        polkadotAccountIsEnable: (state, polkadotEnable: {
            payload: boolean,
            type: string
        }) => {
            state.polkadotEnable = polkadotEnable.payload;
        },



        setSignlessAddress: (state, signlessAddress: {
            payload: HexString | null,
            type: string
        }) => {
            state.signlessAddress = signlessAddress.payload;
        },
        setNoWalletEncryptedName: (state, encryptedName: {
            payload: string | null,
            type: string
        }) => {
            state.noWalletEncryptedName = encryptedName.payload;
        },

        setGaslessActive: (state, gasslessState: {
            payload: boolean,
            type: string
        }) => {
            state.gaslessIsActive = gasslessState.payload;
        },
        setShowGaslessSwitch: (state, gasslessState: {
            payload: boolean,
            type: string
        }) => {
            state.showGaslessSwitch = gasslessState.payload;
        },
    }
});

export const {
    gearApiStarted,
    apiIsBusy,
    apiIsDisconnected,
    polkadotAccountIsEnable,
    setSignlessAddress,
    setNoWalletEncryptedName,
    setGaslessActive,
    setShowGaslessSwitch
} = accountSettingsSlice.actions;

export default accountSettingsSlice.reducer;