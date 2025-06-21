import { AuthProviderProps } from "react-oidc-context";

export const CognitoAuthConfig: AuthProviderProps = {
  authority: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}`,
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  redirect_uri: process.env.NEXT_PUBLIC_BASE_URL + "callback",
  response_type: "code",
  scope: "openid profile email",
};