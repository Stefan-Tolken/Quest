import { useAuth } from "react-oidc-context";

export function useAuthState() {
    const auth = useAuth();

    const signOutRedirect = () => {
        auth.removeUser();
        
        const clientId = "8v7j9shv683p12k78rcdmjfl2";
        const logoutUri = "http://localhost:3000";
        const cognitoDomain = "https://us-east-1y90morfaw.auth.us-east-1.amazoncognito.com";
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };

    return {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        user: auth.user,
        error: auth.error,
        signin: auth.signinRedirect,
        signout: signOutRedirect,
    };
}