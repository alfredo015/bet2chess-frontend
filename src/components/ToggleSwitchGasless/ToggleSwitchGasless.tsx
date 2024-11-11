import { Switch } from '@chakra-ui/react'
import GaslessIcon from '@/assets/images/icons/gas-station-line.svg';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setGaslessActive } from '@/app/SliceReducers';
import { useAlert } from '@gear-js/react-hooks';
import './ToggleSwitchGasless.css';
import { useDappContext } from '@/context';

export const ToggleSwitchGasless = () => {
  const dispatch = useAppDispatch();
  const alert = useAlert();
  const showSwitch = useAppSelector((state) => state.AccountsSettings.showGaslessSwitch);
  const {
    setCurrentVoucherId,
    setSignlessAccount
  } = useDappContext();
 
  return (
    <div className='toggle-switch-gasless'>
      {
        showSwitch && <>
          <Switch 
            onChange={(e) => {
              const checked = e.target.checked;

              if (checked) {
                alert.info('Using dapp with vouchers');
              } else {
                alert.info('Using dapp with signless session');
              }
              dispatch(setGaslessActive(e.target.checked));
              setCurrentVoucherId(null);
              setSignlessAccount(null);
            }}
          />
          <img 
            src={GaslessIcon} 
            alt="gasless icon" 
            className='toggle-switch-gasless__icon'
          />
        </>
      }
    </div>
  )
}
