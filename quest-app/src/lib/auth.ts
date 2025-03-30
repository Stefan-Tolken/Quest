import { AuthProviderProps } from "react-oidc-context";

export const CognitoAuthConfig: AuthProviderProps = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_oDkGpPpBl",
  client_id: "3buk3745f26l9rkdel07b2k6p5",
  redirect_uri: "http://localhost:3000/callback",
  response_type: "code",
  scope: "openid profile email",
};