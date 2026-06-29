import { LocationClient } from "@aws-sdk/client-location";
import { SQS } from "@aws-sdk/client-sqs";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { withIdentityPoolId } from "@aws/amazon-location-utilities-auth-helper";
import {
  REGION,
  READ_ONLY_IDENTITY_POOL_ID,
  WRITE_ONLY_IDENTITY_POOL_ID,
} from "../configuration";

// Cache auth helpers
let authHelpers = {
  readOnlyAuthHelper: undefined,
  writeOnlyAuthHelper: undefined,
};

export const getAuthHelpers = async () => {
  if (!authHelpers.readOnlyAuthHelper) {
    authHelpers.readOnlyAuthHelper = await withIdentityPoolId(
      READ_ONLY_IDENTITY_POOL_ID,
      { region: REGION }
    );
  }
  if (!authHelpers.writeOnlyAuthHelper) {
    authHelpers.writeOnlyAuthHelper = await withIdentityPoolId(
      WRITE_ONLY_IDENTITY_POOL_ID,
      { region: REGION }
    );
  }
  return authHelpers;
};

export const createLocationClient = (credentials, region = REGION) => {
  return new LocationClient({
    ...credentials,
    region,
  });
};

export const createSQSClient = (credentials, region = REGION) => {
  return new SQS({
    ...credentials,
    region,
  });
};
