
import { useSession } from "core/AuthClient";
import { createContext } from "react";

export const SessionContext = createContext<any | null>(null);
