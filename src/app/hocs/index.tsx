import {
	ApiProvider as GearApiProvider,
	AlertProvider as GearAlertProvider,
	AccountProvider as GearAccountProvider,
	ProviderProps,
} from "@gear-js/react-hooks";
import { ComponentType } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ADDRESS } from "@/app/consts";
import { Alert, alertStyles } from "@/components/ui/alert";
import { DAppContextProvider, SailsProvider } from "@/context";
import { name as appName } from '../../../package.json';

const queryClient = new QueryClient({
	defaultOptions: {
	  queries: {
		gcTime: 0,
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		retry: false,
	  },
	},
  });
  
  function ApiProvider({ children }: ProviderProps) {
	return <GearApiProvider initialArgs={{ endpoint: ADDRESS.NODE }}>{children}</GearApiProvider>;
  }
  
  function AlertProvider({ children }: ProviderProps) {
	return (
	  <GearAlertProvider template={Alert} containerClassName={alertStyles.root}>
		{children}
	  </GearAlertProvider>
	);
  }
  
  function AccountProvider({ children }: ProviderProps) {
	return <GearAccountProvider appName={appName}>{children}</GearAccountProvider>;
  }
  
  function QueryProvider({ children }: ProviderProps) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

const providers = [
	AlertProvider,
	ApiProvider,
	AccountProvider,
	DAppContextProvider,
	SailsProvider
];

function withProviders(Component: ComponentType) {
	return () => providers.reduceRight((children, Provider) => <Provider>{children}</Provider>, <Component />);  
}
export { withProviders };
