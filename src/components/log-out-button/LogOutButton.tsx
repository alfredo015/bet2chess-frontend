import { Button } from '@chakra-ui/react';
import { useDappContext } from '@/context'; 
import { LogOut } from 'lucide-react';

interface Props {
    onUserClick?: () => void
}

export const LogOutButton = ({ onUserClick }: Props) => {
    const { 
        sailsIsBusy,
        setCurrentVoucherId,
        setSignlessAccount,
        setNoWalletSignlessAccountName
    } = useDappContext();

    return (
        <Button
            onClick={() => {
                if (onUserClick) onUserClick();
                setCurrentVoucherId(null);
                setSignlessAccount(null);
                setNoWalletSignlessAccountName(null);
            }}
            isLoading={sailsIsBusy}
          >
            <LogOut />
            <p>Log out</p>
          </Button>
    )
}
