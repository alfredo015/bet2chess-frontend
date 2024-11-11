import React, { useState } from 'react';
import { Logo } from './logo';
import { AccountInfo } from './account-info';
import { useAppSelector, useSailsCalls } from '@/app/hooks';
import { ToggleSwitchAccounts } from '@/components/ToggleSwitchAccounts/ToggleSwitchAccounts';
import { ToggleSwitchGasless } from '@/components/ToggleSwitchGasless/ToggleSwitchGasless';
import { SignlessForm } from '@/components/SignlessForm/SignlessForm';
import { KeyringPair } from "@polkadot/keyring/types";
import { useDappContext } from '@/context';
import { useAlert } from '@gear-js/react-hooks';
import { decodeAddress } from '@gear-js/api';
import { Button } from '@chakra-ui/react';
import { WalletlessUserData } from '@/components/WalletlessUserData/WalletlessUserData';
import { UserIcon } from 'lucide-react';
import styles from './header.module.scss';

type Props = {
  isAccountVisible: boolean;
};

export function Header({ isAccountVisible }: Props) {
  const sails = useSailsCalls();
  const alert = useAlert();
  const polkadotWalletEnable = useAppSelector((state) => state.AccountsSettings.polkadotEnable);
  const [signlessModalIsOpen, setSignlessModalIsOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const {
		signlessAccount,
		setSignlessAccount,
		setNoWalletSignlessAccountName,
		setCurrentVoucherId,
	} = useDappContext();

  const manageSignlessAccount = (
		signlessAccount: KeyringPair,
		encryptedName: string | null
	): Promise<void> => {
		return new Promise(async (resolve) => {
			if (setSignlessAccount) setSignlessAccount(signlessAccount);
			if (setNoWalletSignlessAccountName)
				setNoWalletSignlessAccountName(
					encryptedName ?? "no-wallet-singless-name"
				);

			// [TODO]: CHECK THIS PART WITH SAILS
			if (!sails) {
				return;				
			}

			try {
				const signlessVoucherId = await sails.vouchersInContract(
					decodeAddress(signlessAccount.address)
				);
				setCurrentVoucherId(signlessVoucherId[0]);
			} catch (e) {
				alert.error("Error while setting signless account voucher id");
			}

			const signlessAddress = decodeAddress(signlessAccount.address);

			localStorage.address = signlessAddress;
			localStorage.name = encryptedName;

			const serverResponse = await fetch(
				`https://vchess.pythonanywhere.com/loginplayer?name=${encryptedName}&account=${signlessAddress}`
			);

			const formatedResponse = await serverResponse.json();

			localStorage.playerID = formatedResponse.status;
			resolve();
		});
	};

  return (
    <>
      <header className={styles.header}>
        <Logo />
        {
          polkadotWalletEnable ? (
            <div className={styles.optionsContainer}>
              <ToggleSwitchGasless />
              <ToggleSwitchAccounts />
              {isAccountVisible && <AccountInfo />}
            </div>
          ) : (
            !signlessAccount ? (
              <Button
                // text="Sign in" 
                backgroundColor='white.400'
                onClick={() => setSignlessModalIsOpen(true)}
              >
                Sign in
              </Button>
            ) : (
              <Button
                padding={0}
                onClick={() => setAccountModalOpen(true)}
              >
                <UserIcon />
              </Button>
            )
          )
        }
        { accountModalOpen && <WalletlessUserData closeModal={() => setAccountModalOpen(false)} /> }
      </header>
      {
        signlessModalIsOpen && (
          <SignlessForm
            closeForm={() => setSignlessModalIsOpen(false)}
            onDataCollected={manageSignlessAccount}
          />
        )
      }
    </>
  );
}
