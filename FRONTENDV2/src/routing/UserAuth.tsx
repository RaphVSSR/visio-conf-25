import { FC, useContext } from "react";
import { SessionContext } from "../contexts/SessionContext";
import { Navigate, Outlet } from "react-router-dom";

export const UserAuth: FC = () => {

	const session = useContext(SessionContext);

	if (!session!.currentUser){
		
		return <Navigate to={"/login"} replace/>;

	}else {

		return <Navigate to={"/home"} replace/>;
		
	}
}