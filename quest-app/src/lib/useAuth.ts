import { useAuth } from "react-oidc-context";

export function useAuthState() {
    const auth = useAuth();

    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    const logoutUri = baseUrl;
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

    const signOutRedirect = () => {
        auth.removeUser();
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };

    const signupRedirect = () => {
        window.location.href = `${cognitoDomain}/signup?client_id=${clientId}&response_type=code&scope=openid+profile+email&redirect_uri=${encodeURIComponent(baseUrl)}&screen_hint=signup`;
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