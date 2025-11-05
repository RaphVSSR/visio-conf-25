import { createContext } from "react";

export type SessionType = {

	currentUser: any | null,
	theme: "light" | "dark",
}

export const SessionContext = createContext<SessionType | null>(null);