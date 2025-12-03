import { FC, useContext, useEffect } from "react";
import { SessionContext } from "../contexts/SessionContext";
import { Navigate, Outlet } from "react-router-dom";

export const UserAuth: FC = () => {

	const session = useContext(SessionContext);

	if (!session.isLoading){
		
		if (!session.currentUser.data){

			return <Navigate to={"/login"} replace/>;

		}else {

			return <Outlet />;
			
		}
		
	}else {

		return <><h1>Chargement du bundle...</h1></>
	}
}