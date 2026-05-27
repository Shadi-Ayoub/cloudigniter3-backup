CI_UNAUTH_ROLE_ARN

The platform allows unauthorized users to call getSettings API from the platform.
This requires the Identity Pool Unauthorized Role resource ID. For authorized users,
The platform uses Cognito rather than IAM. Hence, the Identity Pool Authorized Role
is not needed.

For the CI_UNAUTH_ROLE_ARN initialization:
1) Deploy first time
2) Run the command "yarn list-identity-pools" to get the existing identity pool IDs. Alternatively,
   check the amplify_outputs.json file for the Pool Identity Id.
3) Run the command "yarn get-identity-pool-roles" after updating it in the Pacjage.json file