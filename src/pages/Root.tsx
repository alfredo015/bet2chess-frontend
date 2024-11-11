import { Outlet } from "react-router-dom";
import { Header } from "@/components";
import { useAccount, useApi } from "@gear-js/react-hooks";
import { ApiLoader } from "@/components";

export const Root = () => {
    const { isAccountReady } = useAccount();
	const { isApiReady } = useApi();
	const isAppReady = isApiReady && isAccountReady;
	
	return (
		<>
			<Header isAccountVisible={isAccountReady} />
			{
				isAppReady ? (
					<Outlet />
				) : (
					<ApiLoader />
				)
			}
		</>

	);	
};
