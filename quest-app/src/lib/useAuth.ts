import { useAuth } from "react-oidc-context";

export function useAuthState() {
    const auth = useAuth();

    const signOutRedirect = () => {
        const clientId = "4bnj35a85lf87tg75aslkk6fre";
        const logoutUri = "<logout uri>";
        const cognitoDomain = "https://<user pool domain>";
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