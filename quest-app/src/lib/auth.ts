import { AuthProviderProps } from "react-oidc-context";

export const CognitoAuthConfig: AuthProviderProps = {
  authority: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_y90MOrfAw`, // Use the IDP endpoint
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  redirect_uri: process.env.NEXT_PUBLIC_BASE_URL + "callback",
  response_type: "code",
  scope: "openid profile email",
  loadUserInfo: false, // Cognito includes user info in ID token
  automaticSilentRenew: false, // Disable automatic token renewal
};