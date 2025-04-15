import { AuthProviderProps } from "react-oidc-context";

export const CognitoAuthConfig: AuthProviderProps = {
  authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_MQ3gFksBU",
  client_id: "4bnj35a85lf87tg75aslkk6fre",
  redirect_uri: "http://localhost:3000/callback",
  response_type: "code",
  scope: "openid profile email",
};