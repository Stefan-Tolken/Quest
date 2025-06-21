import { useAuth } from "react-oidc-context";

export function useAuthState() {
    const auth = useAuth();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://quest-sable.vercel.app/";
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = baseUrl;

    const signOutRedirect = () => {
        auth.removeUser();
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };

    const signupRedirect = () => {
        window.location.href = `${cognitoDomain}/login?client_id=${process.env.COGNITO_CLIENT_ID}&response_type=code&scope=openid+profile+email&redirect_uri=${encodeURIComponent(baseUrl)}&screen_hint=signup`;
    };

    return {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        user: auth.user,
        error: auth.error,
        signin: auth.signinRedirect,
        signout: signOutRedirect,
        signup: signupRedirect,
    };
}