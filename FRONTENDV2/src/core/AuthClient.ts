
import { createAuthClient } from "better-auth/react";

export const AuthClient = createAuthClient({

    baseURL: process.env.REACT_APP_BACKEND_API_URL
})

export const { useSession } = AuthClient;