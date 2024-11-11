import { useState, useEffect } from 'react';
import { Modal } from '@gear-js/vara-ui';
import { useDappContext } from '@/context'; 
import { decodeAddress, HexString } from '@gear-js/api';
import { useSailsCalls } from '@/app/hooks';
import { Button, Center } from '@chakra-ui/react';
import { LogOutButton } from '../log-out-button/LogOutButton';
import { CopyDecoded } from '@/assets/images';
import { shortString } from '@/app/utils';
import { useAlert } from '@gear-js/react-hooks';
import './WalletlessUserData.css';

interface Props {
    closeModal: any
}

export const WalletlessUserData = ({ closeModal }: Props) => {
    const sails = useSailsCalls();
    const alert = useAlert();
    const { 
        signlessAccount,
        currentVoucherId,
        noWalletSignlessAccountName
    } = useDappContext();
    const [voucherBalance, setVoucherBalance] = useState(0);

    const getVoucherBalance = async () => {
        if (!sails) {
            console.error('Sails is not ready');
            return;
        }

        if (!currentVoucherId) {
            console.error('Voucher is not ready');
            return;
        }

        const balance = await sails.voucherBalance(currentVoucherId);
        setVoucherBalance(balance);
    }

    useEffect(() => {
        getVoucherBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    

    return (
        <Modal
            heading='Account data'
            close={closeModal}
        >
            <div className='account-information-container'>
                <p>Name: {noWalletSignlessAccountName ?? ''}</p>
                <div className='address-information-container'>
                    <p>Address: {shortString(9, decodeAddress(signlessAccount?.address as HexString))}</p>
                    <Button
                        padding={1}
                        backgroundColor='transparent'
                        onClick={async () => {
                            const text = decodeAddress(signlessAccount?.address as HexString);
                            try {
                                await navigator.clipboard.writeText(text);
                                alert.success('Copied');
                            } catch(e) {
                                alert.error('Error copying address');
                            }
                        }}
                    >
                        <CopyDecoded />
                    </Button>
                </div>
                <p>Voucher balance: {voucherBalance}</p>
            </div>
            <br />
            <Center>
                <LogOutButton onUserClick={closeModal}/>
            </Center>
        </Modal>
    );
}
