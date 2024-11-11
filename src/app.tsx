import "@gear-js/vara-ui/dist/style.css";
import { Account, useAccount } from "@gear-js/react-hooks";
import { withProviders } from "@/app/hocs";
import { useWalletSync } from "@/features/wallet/hooks";
import { useEffect } from "react";
import { useDappContext } from "./context";
import { useAppDispatch, useAppSelector, useInitSails } from "./app/hooks";
import {
	polkadotAccountIsEnable,
	setShowGaslessSwitch,

	deleteAllUserGameData,
	setUserAddress,
	setUserName,
	setUserId,
} from "./app/SliceReducers";
import { KeyringPair } from '@polkadot/keyring/types';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { 
	Root,
	Index,
	GameMatch,
	gameMatchLoader
} from "./pages";
import { HexString } from "@gear-js/api";
import { CONTRACT_DATA, sponsorMnemonic, sponsorName } from "./app/consts";
import axios from "axios";

import "./App.css";


type AccountObjectWallet = { wallet: Account };
type AccountObjectKeyringPair = { keyringPair: KeyringPair };
type AccountObjectType = AccountObjectWallet | AccountObjectKeyringPair;
type AccountType = 'wallet' | 'keyringpair';

interface UserData { 
	userAddress: string | null,
	userName: string | null,
	userId: number | null
}

interface AccountTypeI {
	account: AccountObjectType,
	type: AccountType
};

let test: UserData | null = null;

const router = createBrowserRouter([
	{
		path: "/",
		element: <Root />,
		errorElement: <h1>Error a nivel raiz!!</h1>,
		children: [
			{
				errorElement: <h1>ERROR A NIVEL HIJOS</h1>,
				children: [
					{
						index: true,
						element: <Index />,
					},
					{
						path: "game/:gameid",
						element: <GameMatch />,
						loader: gameMatchLoader
					},
				],
			},
		],
	},
]);

function Component() {
	const { account, accounts, isAccountReady, extensions } = useAccount();
	const { signlessAccount, setSignlessAccount } = useDappContext();
	const actualUserAddress = useAppSelector(state => state.UserGameData.userAddress);
	const dispatch = useAppDispatch();

	useInitSails({
		network: 'wss://testnet.vara.network',
		contractId: CONTRACT_DATA.programId,
		idl: CONTRACT_DATA.idl,
		vouchersSigner: {
			sponsorName,
			sponsorMnemonic
		}
	});

	useWalletSync();

	const getUserIdFromServer = async (account: AccountTypeI): Promise<[string, HexString, number]> => {
		return new Promise(async (resolve, reject) => {
			let name;
			let address;

			if (account.type === 'wallet') {
				const { wallet } = account.account as AccountObjectWallet;
				
				name = wallet.meta.name ? wallet.meta.name : "";
				address = wallet.address;
			} else {
				const { keyringPair } = account.account as AccountObjectKeyringPair;
				name = keyringPair.meta.name ? keyringPair.meta.name : "";
				address = keyringPair.address;
			}

			try {
				const response = await axios.get(
					`https://vchess.pythonanywhere.com/loginplayer?name=${name}&account=${address}`
				);

				const {status: idPlayer} = response.data;

				resolve([name, address as HexString, idPlayer]);
			} catch (e) {
				reject(e);
			}
		});
	}

	useEffect(() => {
		const hasExtensions = extensions && extensions.length > 0; // Check if show wallet or not in case an extension exists

		if (isAccountReady && hasExtensions) {
			dispatch(polkadotAccountIsEnable(true));
			dispatch(setShowGaslessSwitch(true));
		} else {
			dispatch(polkadotAccountIsEnable(false));
			dispatch(setShowGaslessSwitch(false));
		}
	}, [isAccountReady, extensions, accounts]);

	useEffect(() => {
		const setWalletGameId = async (account: Account) => {
			const [name, address, userId] = await getUserIdFromServer({
				account: { wallet: account },
				type: 'wallet'
			});

			dispatch(setUserAddress(address));
			dispatch(setUserName(name));
			dispatch(setUserId(userId));
		}

		const setKeyringGameId = async (account: KeyringPair) => {
			const [name, address, userId] = await getUserIdFromServer({
				account: { keyringPair: account },
				type: 'keyringpair'
			});

			dispatch(setUserAddress(address));
			dispatch(setUserName(name));
			dispatch(setUserId(userId));
		}

		if (account) {
			setWalletGameId(account);

			if (actualUserAddress != account.address) {
				console.log('NO SON IGUALES');
				setSignlessAccount(null);
			}

			const intervalId = setInterval(async () => {
				await getUserIdFromServer({
					account: { wallet: account },
					type: 'wallet'
				});
			}, 999);

			return () => clearInterval(intervalId);
		}

		if (signlessAccount) {
			setKeyringGameId(signlessAccount);

			const intervalId = setInterval(async () => {
				await getUserIdFromServer({
					account: { keyringPair: signlessAccount },
					type: 'keyringpair'
				});
			}, 999);

			return () => clearInterval(intervalId);
		}

		dispatch(deleteAllUserGameData());
	}, [ account, signlessAccount ]);

	return <RouterProvider router={router} />;
}

export const App = withProviders(Component);
