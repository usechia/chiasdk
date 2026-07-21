import { useChia } from "../provider";

export interface PortalSession {
	token: string | null;
	expiresAt: string | null;
	isAuthenticated: boolean;
	signOut: () => void;
}

export function usePortalSession(): PortalSession {
	const { sessionToken, sessionExpiresAt, clearToken } = useChia();

	return {
		token: sessionToken,
		expiresAt: sessionExpiresAt,
		isAuthenticated: sessionToken !== null,
		signOut: clearToken,
	};
}
