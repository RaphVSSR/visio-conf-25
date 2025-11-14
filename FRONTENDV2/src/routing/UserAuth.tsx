import { FC, useContext } from "react";
import { SessionContext } from "../contexts/SessionContext";
import { Navigate, Outlet } from "react-router-dom";
import SocketIO from "core/SocketIo";

export const UserAuth: FC = () => {

	const session = useContext(SessionContext);
	
	if (!session.currentUser || !session.currentUser.data){
		
		//SocketIO.init();
		//SocketIO.emit();

		return <Navigate to={"/login"} replace/>;

	}else {

		return <Navigate to={"/home"} replace/>;
		
	}

}