import { Wallet } from "./wallet";
import { AccountsModal } from "./accounts-modal";
import {
	useApi,
	useAccount,
	useBalance,
	useBalanceFormat,
} from "@gear-js/react-hooks";
import { Button } from "@gear-js/ui";
import { useState, useEffect } from "react";

export function AccountInfo() {
	const { isApiReady } = useApi();
	const { account, accounts } = useAccount();
	const { balance } = useBalance(account?.address);
	const { getFormattedBalance } = useBalanceFormat();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const formattedBalance =
		isApiReady && balance ? getFormattedBalance(balance) : undefined;

	const openModal = () => {
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
	};


	/*
	
	useEffect(() => {
		console.log("Hi this is the wallet");

		const keyring = new Keyring();

		const interval = setInterval(() => {
			if (account) {
				console.log(
					"WALLET: in the interval: " +
						account.address +
						"  " +
						account.meta.name
				);
				if (account.address !== "") {
					console.log("WALLET: namewallet exists");

					const publicAddress = keyring.decodeAddress(account.address);
					const hexAddress = u8aToHex(publicAddress);

					localStorage.address = account.address;
					localStorage.name = account.meta.name;

					console.log(
						"WALLET: Im checking it out now " +
							account.meta.name +
							" with account: " +
							account.address +
							" HEXX: " +
							hexAddress
					);
					fetch(
						`https://vchess.pythonanywhere.com/loginplayer?name=${account.meta.name}&account=${account.address}`
					)
						.then((response) => response.json())
						.then((data) => {
							console.log(
								"WALLET: This is the result of calling loginplayer:" +
									JSON.stringify(data)
							);
							localStorage.playerID = data.status;
							console.log(
								"WALLET: localSotrage.playerID = " + localStorage.playerID
							);
						})
						.catch((error) => console.error(error));
				}
			}
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	*/

	return (
		<>
			{account ? (
				<Wallet
					balance={formattedBalance}
					address={account.address}
					name={account.meta.name}
					onClick={openModal}
				/>
			) : (
				<Button text="Sign in" onClick={openModal} />
			)}
			{isModalOpen && <AccountsModal accounts={accounts} close={closeModal} />}
		</>
	);
}

// return (
//   <>
//     <div className={clsx(styles.wrapper, className)}>
//       {!!account && (
//         <>
//           {formattedBalance && (
//             <VaraBalance value={formattedBalance.value} unit={formattedBalance.unit} className={styles.balance} />
//           )}

//           <Button variant="text" className={styles.openWallet} onClick={openWallet}>
//             {isOpen ? (
//               <CrossIcon />
//             ) : (
//               <>
//                 <AvaVaraBlack width={24} height={24} />
//                 <ChevronDown />
//               </>
//             )}
//           </Button>
//         </>
//       )}
//     </div>
//   </>
// );
