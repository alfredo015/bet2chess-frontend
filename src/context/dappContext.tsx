import { HexString } from "@gear-js/api";
import { KeyringPair } from '@polkadot/keyring/types';
import { createContext, useContext, useState } from "react";

interface Props {
    children: JSX.Element
}

export interface UserGameData {
    userId: number | null,
    userName: string | null,
    userAddress: HexString | null
}

interface DAppContextI {
    currentVoucherId: HexString | null, 
    signlessAccount: KeyringPair | null,
    noWalletSignlessAccountName: string | null,
    sailsIsBusy: boolean,
    setSignlessAccount: React.Dispatch<React.SetStateAction<KeyringPair | null>> | null,
    setNoWalletSignlessAccountName: React.Dispatch<React.SetStateAction<string | null>> | null,
    setCurrentVoucherId: React.Dispatch<React.SetStateAction<HexString | null>> | null,
    setSailsIsBusy: React.Dispatch<React.SetStateAction<boolean>> | null,
}

export const dAppContext = createContext<DAppContextI>({
    currentVoucherId: null,
    signlessAccount: null,
    noWalletSignlessAccountName: null,
    sailsIsBusy: false,
    setSignlessAccount: null,
    setNoWalletSignlessAccountName: null,
    setCurrentVoucherId: null,
    setSailsIsBusy: null,
});

export const DAppContextProvider = ({ children }: Props)  => {
    const [currentVoucherId, setCurrentVoucherId] = useState<HexString | null>(null);
    const [signlessAccount, setSignlessAccount] = useState<KeyringPair | null>(null);
    const [noWalletSignlessAccountName, setNoWalletSignlessAccountName] = useState<string | null>(null);
    const [sailsIsBusy, setSailsIsBusy] = useState(false);

    return (
        <dAppContext.Provider 
            value={{
                currentVoucherId,
                signlessAccount,
                noWalletSignlessAccountName,
                sailsIsBusy,
                setCurrentVoucherId,
                setSignlessAccount,
                setNoWalletSignlessAccountName,
                setSailsIsBusy,
            }}
        >
            {children}
        </dAppContext.Provider>
    );
}

export const useDappContext = () => {
    const {
        currentVoucherId,
        signlessAccount,
        noWalletSignlessAccountName,
        sailsIsBusy,
        setCurrentVoucherId,
        setSignlessAccount,
        setNoWalletSignlessAccountName,
        setSailsIsBusy,
    } = useContext(dAppContext);

    return {
        currentVoucherId,
        signlessAccount,
        noWalletSignlessAccountName,
        sailsIsBusy,
        setCurrentVoucherId: setCurrentVoucherId as React.Dispatch<React.SetStateAction<HexString | null>>,
        setSignlessAccount: setSignlessAccount as React.Dispatch<React.SetStateAction<KeyringPair | null>>,
        setNoWalletSignlessAccountName: setNoWalletSignlessAccountName as React.Dispatch<React.SetStateAction<string | null>>,
        setSailsIsBusy: setSailsIsBusy as React.Dispatch<React.SetStateAction<boolean>>,
    }
}