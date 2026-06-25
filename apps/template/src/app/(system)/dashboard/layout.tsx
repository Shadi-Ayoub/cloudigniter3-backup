import type { Metadata } from "next";
import CiLayout from "@cloudigniter/next/layout/cp-standard";
import { appBootstrap } from "@/kernel/server";

export const metadata: Metadata = {
  title: "CloudIgniter Control Panel",
  description: "Cloudigniter platform Control Panel to manage the application!",
};

interface LayoutInterface {
  children: React.ReactNode;
}
export default async function CPLayout({ children }: LayoutInterface) {
  const config = await appBootstrap();
  // throw new Error(`Main Menu Config: ${JSON.stringify(config)}`);
  return <CiLayout config={config}>{children}</CiLayout>;
}
// const x = {
//   ciConfig: {
//     providers: {
//       aws: {
//         cognito: { client: { region: "us-east-1" } },
//         dynamodb: { clientConfig: { region: "us-east-1" } },
//       },
//     },
//     app: {
//       loginRoute: "/login",
//       route: {
//         namespaceCookieName: "ci-namespace",
//         namespaceHeaderName: "x-ci-namespace",
//       },
//     },
//     auth: {
//       loginRoute: "/login",
//       authUi: {
//         custom: { merge: true, loadingText: "Signing you in. Please wait..." },
//         visibility: {
//           minHeightPx: 16,
//           debounceMs: 0,
//           initialMountSuppressMs: 1200,
//           minVisibleStableMs: 300,
//         },
//       },
//     },
//     data: { publicAuthMode: "public" },
//     route: {
//       namespaceCookieName: "ci-route-namespace",
//       namespaceHeaderName: "x-ci-route-namespace",
//       pathnameCookieName: "ci-route-pathname",
//       pathnameHeaderName: "x-ci-route-pathname",
//       infoPageStrategy: "rewrite",
//     },
//     i18n: {
//       locales: [
//         { code: "en", name: "english" },
//         { code: "ar", name: "arabic" },
//       ],
//       cookieName: "ci-locale",
//       defaultLocale: "en",
//     },
//     theme: { enableSystem: true, storageKey: "ci-theme" },
//     tenant: {
//       enabled: true,
//       mode: "slug",
//       basePath: "/t",
//       idHeaderName: "x-ci-tenant-id",
//       modeHeaderName: "x-ci-tenant-mode",
//       scopeHeaderName: "x-ci-tenant-scope",
//       statusHeaderName: "x-ci-tenant-status",
//       idCookieName: "ci-tenant-id",
//       modeCookieName: "ci-tenant-mode",
//       scopeCookieName: "ci-tenant-scope",
//       statusCookieName: "ci-tenant-status",
//       writeTenantCookie: true,
//       rewriteSubdomainToTenantPath: true,
//       rootDomains: ["http://localhost:3000/"],
//       reservedSubdomains: ["www", "admin", "app", "api"],
//       reservedTenantSlugs: ["login", "logout", "ci-internal"],
//       lookupPath: "/ci-internal/tenant-lookup",
//       validateTenant: false,
//       notFoundPath: "/tenant/not-found",
//       suspendedPath: "/tenant/suspended",
//       infoPageStrategy: "rewrite",
//     },
//     routes: {
//       "/": {
//         title: "CloudIgniter Application Home Page",
//         namespace: "home",
//         protected: false,
//       },
//       "/auth-test": {
//         title: "Test Authentication",
//         namespace: "testing",
//         protected: true,
//       },
//       "/dashboard": {
//         title: "Admin Dashboard",
//         namespace: "dashboard",
//         protected: true,
//       },
//       "/dashboard/auth": {
//         title: "Manage Authorization",
//         namespace: "authorization",
//         protected: true,
//       },
//       "/dashboard/dev": {
//         title: "Developer Toolbox",
//         namespace: "dev",
//         protected: true,
//       },
//       "/dashboard/dev/install1": {
//         title: "CloudIgniter Application Installation Page",
//         namespace: "dev",
//         protected: false,
//       },
//       "/dashboard/dev/sandbox/*": {
//         title: "CloudIgniter Application Sandbox Section",
//         namespace: "dev",
//         protected: true,
//       },
//       "/dashboard/dev/seeder/*": {
//         title: "CloudIgniter Application Seeder Tool",
//         namespace: "dev",
//         protected: true,
//       },
//       "/dashboard/settings": {
//         title: "Manage Settings",
//         namespace: "systemSettings",
//         protected: true,
//       },
//       "/dashboard/tenants": {
//         title: "Manage Tenants",
//         namespace: "tenants",
//         protected: true,
//       },
//       "/dashboard/theme": {
//         title: "Theme Presentation",
//         namespace: "theme",
//         protected: false,
//       },
//       "/dashboard/users/*": {
//         title: "List Users",
//         namespace: "users",
//         protected: true,
//       },
//       "/login": {
//         title: "Login Page",
//         namespace: "authentication",
//         protected: false,
//       },
//       "/logout": {
//         title: "Logout Page",
//         namespace: "authentication",
//         protected: true,
//       },
//       "/t/:id": {
//         title: "CloudIgniter Application Tenants Tree",
//         namespace: "tenant",
//         protected: true,
//       },
//       "/test": { title: "Test Page", namespace: "test", protected: true },
//     },
//     dev: {
//       debug: { debugProbe: { enabled: true } },
//       traceLog: {
//         enabled: true,
//         truncRate: 0.5,
//         filePath: "/tmp/ci-trace.log",
//         endPoint: "/ci-internal/trace-append",
//         metrics: { duration: true },
//         debug: false,
//       },
//     },
//     locale: "en",
//     direction: "ltr",
//     messages: {
//       common: {
//         cancel: "Cancel",
//         close: "close",
//         "Coming Soon": "Coming Soonxxx",
//         dashboard: "Dashboard",
//         hello: "Hello",
//         home: "Home",
//         submit: "Submit",
//         welcome: "Welcome",
//       },
//       error: {
//         criticalError: "critical error",
//         error: "error",
//         info: "info",
//         warning: "warning",
//       },
//       errorTheme: {
//         criticalThemeNotExist:
//           "Unknown theme name ''{theme}''! The system can only accept a theme name from the list {themeList}.",
//       },
//       errorRoute: {
//         criticalRouteNotRegistered:
//           "The page route ''{route}'' is not registered!",
//       },
//       form: {
//         invalidEmail: "Invalid email address.",
//         required: "This field is required.",
//       },
//       localeSwitcher: { arabic: "Arabic", english: "English" },
//       mainFooter: {
//         "all rights reserved": "all rights reserved.",
//         copyright: "",
//         development: "development",
//         environment: "environment",
//       },
//       themeSwitcher: { dark: "Dark", light: "Light", system: "System" },
//       dashboard: {
//         admins: "admins",
//         install: "install",
//         languages: "languages",
//         overview: "Overview",
//         sandbox: "sandbox",
//         security: "security",
//         settings: "settings",
//         tenants: "tenants",
//         theme: "theme",
//         devtools: "devtools",
//         title: "Dashboard",
//         users: "users",
//       },
//     },
//     amplifyOutputs: {
//       auth: {
//         user_pool_id: "us-east-1_dPHGEnafF",
//         aws_region: "us-east-1",
//         user_pool_client_id: "2m0un75g0ueq99mmqpfetpqp89",
//         identity_pool_id: "us-east-1:ffc8a70c-7481-4254-a330-0ad328c7d7f2",
//         mfa_methods: [],
//         standard_required_attributes: ["email", "given_name", "family_name"],
//         username_attributes: ["email"],
//         user_verification_types: ["email"],
//         groups: [
//           { USER: { precedence: 0 } },
//           { DEVELOPER: { precedence: 1 } },
//           { ADMIN: { precedence: 2 } },
//           { SUPER_ADMIN: { precedence: 3 } },
//           { SYSTEM_ADMIN: { precedence: 4 } },
//           { SYSTEM_SUPER_ADMIN: { precedence: 5 } },
//         ],
//         mfa_configuration: "NONE",
//         password_policy: {
//           min_length: 8,
//           require_lowercase: true,
//           require_numbers: true,
//           require_symbols: true,
//           require_uppercase: true,
//         },
//         unauthenticated_identities_enabled: true,
//       },
//       data: {
//         url: "https://xd7q4e7ngfcq7nburzroyo73ke.appsync-api.us-east-1.amazonaws.com/graphql",
//         aws_region: "us-east-1",
//         api_key: "da2-k3wa26nvlvcebjhko32lzolvda",
//         default_authorization_type: "AMAZON_COGNITO_USER_POOLS",
//         authorization_types: ["API_KEY", "AWS_IAM"],
//         model_introspection: {
//           version: 1,
//           models: {
//             PublicSettings: {
//               name: "PublicSettings",
//               fields: {
//                 tenantId: {
//                   name: "tenantId",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 key: {
//                   name: "key",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 status: {
//                   name: "status",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 version: {
//                   name: "version",
//                   isArray: false,
//                   type: "Int",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 data: {
//                   name: "data",
//                   isArray: false,
//                   type: "AWSJSON",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 createdAt: {
//                   name: "createdAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//                 updatedAt: {
//                   name: "updatedAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//               },
//               syncable: true,
//               pluralName: "PublicSettings",
//               attributes: [
//                 { type: "model", properties: {} },
//                 { type: "key", properties: { fields: ["tenantId", "key"] } },
//                 {
//                   type: "key",
//                   properties: {
//                     name: "byTenant",
//                     queryField: "listPublicSettingsByTenantId",
//                     fields: ["tenantId"],
//                   },
//                 },
//                 {
//                   type: "auth",
//                   properties: {
//                     rules: [
//                       {
//                         allow: "public",
//                         provider: "apiKey",
//                         operations: ["read"],
//                       },
//                       {
//                         groupClaim: "cognito:groups",
//                         provider: "userPools",
//                         allow: "groups",
//                         operations: ["create", "read", "update", "delete"],
//                         groups: ["SYSTEM_ADMIN"],
//                       },
//                     ],
//                   },
//                 },
//               ],
//               primaryKeyInfo: {
//                 isCustomPrimaryKey: true,
//                 primaryKeyFieldName: "tenantId",
//                 sortKeyFieldNames: ["key"],
//               },
//             },
//             PrivateSettings: {
//               name: "PrivateSettings",
//               fields: {
//                 tenantId: {
//                   name: "tenantId",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 key: {
//                   name: "key",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 status: {
//                   name: "status",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 version: {
//                   name: "version",
//                   isArray: false,
//                   type: "Int",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 data: {
//                   name: "data",
//                   isArray: false,
//                   type: "AWSJSON",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 createdAt: {
//                   name: "createdAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//                 updatedAt: {
//                   name: "updatedAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//               },
//               syncable: true,
//               pluralName: "PrivateSettings",
//               attributes: [
//                 { type: "model", properties: {} },
//                 { type: "key", properties: { fields: ["tenantId", "key"] } },
//                 {
//                   type: "key",
//                   properties: {
//                     name: "byTenant",
//                     queryField: "listPrivateSettingsByTenantId",
//                     fields: ["tenantId"],
//                   },
//                 },
//                 {
//                   type: "auth",
//                   properties: {
//                     rules: [
//                       {
//                         groupClaim: "cognito:groups",
//                         provider: "userPools",
//                         allow: "groups",
//                         operations: ["create", "read", "update", "delete"],
//                         groups: ["SYSTEM_ADMIN"],
//                       },
//                     ],
//                   },
//                 },
//               ],
//               primaryKeyInfo: {
//                 isCustomPrimaryKey: true,
//                 primaryKeyFieldName: "tenantId",
//                 sortKeyFieldNames: ["key"],
//               },
//             },
//             UserSettings: {
//               name: "UserSettings",
//               fields: {
//                 tenantId: {
//                   name: "tenantId",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 userId: {
//                   name: "userId",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 key: {
//                   name: "key",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 status: {
//                   name: "status",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 version: {
//                   name: "version",
//                   isArray: false,
//                   type: "Int",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 data: {
//                   name: "data",
//                   isArray: false,
//                   type: "AWSJSON",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 createdAt: {
//                   name: "createdAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//                 updatedAt: {
//                   name: "updatedAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//               },
//               syncable: true,
//               pluralName: "UserSettings",
//               attributes: [
//                 { type: "model", properties: {} },
//                 {
//                   type: "key",
//                   properties: { fields: ["tenantId", "userId", "key"] },
//                 },
//                 {
//                   type: "key",
//                   properties: {
//                     name: "byUser",
//                     queryField: "listUserSettingsByTenantIdAndUserId",
//                     fields: ["tenantId", "userId"],
//                   },
//                 },
//                 {
//                   type: "auth",
//                   properties: {
//                     rules: [
//                       {
//                         provider: "userPools",
//                         ownerField: "owner",
//                         allow: "owner",
//                         operations: ["create", "read", "update", "delete"],
//                         identityClaim: "sub",
//                       },
//                       {
//                         groupClaim: "cognito:groups",
//                         provider: "userPools",
//                         allow: "groups",
//                         operations: ["create", "read", "update", "delete"],
//                         groups: ["SYSTEM_ADMIN"],
//                       },
//                     ],
//                   },
//                 },
//               ],
//               primaryKeyInfo: {
//                 isCustomPrimaryKey: true,
//                 primaryKeyFieldName: "tenantId",
//                 sortKeyFieldNames: ["userId", "key"],
//               },
//             },
//             System: {
//               name: "System",
//               fields: {
//                 id: {
//                   name: "id",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 PK: {
//                   name: "PK",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 SK: {
//                   name: "SK",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 GSI1PK: {
//                   name: "GSI1PK",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 GSI1SK: {
//                   name: "GSI1SK",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 GSI2PK: {
//                   name: "GSI2PK",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 GSI2SK: {
//                   name: "GSI2SK",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 type: {
//                   name: "type",
//                   isArray: false,
//                   type: { enum: "SystemItemType" },
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 tenantId: {
//                   name: "tenantId",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 status: {
//                   name: "status",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 name: {
//                   name: "name",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 description: {
//                   name: "description",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 resource: {
//                   name: "resource",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 action: {
//                   name: "action",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 scope: {
//                   name: "scope",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 userId: {
//                   name: "userId",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 roleId: {
//                   name: "roleId",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 data: {
//                   name: "data",
//                   isArray: false,
//                   type: "AWSJSON",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 createdAt: {
//                   name: "createdAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//                 updatedAt: {
//                   name: "updatedAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//               },
//               syncable: true,
//               pluralName: "Systems",
//               attributes: [
//                 { type: "model", properties: {} },
//                 { type: "key", properties: { fields: ["PK", "SK"] } },
//                 {
//                   type: "key",
//                   properties: {
//                     name: "GSI1",
//                     queryField: "listSystemByGSI1PKAndGSI1SK",
//                     fields: ["GSI1PK", "GSI1SK"],
//                   },
//                 },
//                 {
//                   type: "key",
//                   properties: {
//                     name: "GSI2",
//                     queryField: "listSystemByGSI2PKAndGSI2SK",
//                     fields: ["GSI2PK", "GSI2SK"],
//                   },
//                 },
//                 {
//                   type: "auth",
//                   properties: {
//                     rules: [
//                       {
//                         groupClaim: "cognito:groups",
//                         provider: "userPools",
//                         allow: "groups",
//                         groups: ["SYSTEM_ADMIN"],
//                         operations: ["create", "update", "delete", "read"],
//                       },
//                     ],
//                   },
//                 },
//               ],
//               primaryKeyInfo: {
//                 isCustomPrimaryKey: true,
//                 primaryKeyFieldName: "PK",
//                 sortKeyFieldNames: ["SK"],
//               },
//             },
//             UserProfile: {
//               name: "UserProfile",
//               fields: {
//                 userId: {
//                   name: "userId",
//                   isArray: false,
//                   type: "ID",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 username: {
//                   name: "username",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                   attributes: [],
//                 },
//                 email: {
//                   name: "email",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 profilePicture: {
//                   name: "profilePicture",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 city: {
//                   name: "city",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 country: {
//                   name: "country",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 address: {
//                   name: "address",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 landline: {
//                   name: "landline",
//                   isArray: false,
//                   type: "AWSPhone",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 mobile: {
//                   name: "mobile",
//                   isArray: false,
//                   type: "AWSPhone",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 profileOwner: {
//                   name: "profileOwner",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                   attributes: [],
//                 },
//                 createdAt: {
//                   name: "createdAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//                 updatedAt: {
//                   name: "updatedAt",
//                   isArray: false,
//                   type: "AWSDateTime",
//                   isRequired: false,
//                   attributes: [],
//                   isReadOnly: true,
//                 },
//               },
//               syncable: true,
//               pluralName: "UserProfiles",
//               attributes: [
//                 { type: "model", properties: {} },
//                 { type: "key", properties: { fields: ["userId"] } },
//                 {
//                   type: "key",
//                   properties: {
//                     name: "userProfilesByUsername",
//                     queryField: "listUserProfileByUsername",
//                     fields: ["username"],
//                   },
//                 },
//                 {
//                   type: "key",
//                   properties: {
//                     name: "userProfilesByEmail",
//                     queryField: "listUserProfileByEmail",
//                     fields: ["email"],
//                   },
//                 },
//                 {
//                   type: "auth",
//                   properties: {
//                     rules: [
//                       {
//                         provider: "userPools",
//                         ownerField: "profileOwner",
//                         allow: "owner",
//                         operations: ["read", "update"],
//                         identityClaim: "cognito:username",
//                       },
//                       {
//                         groupClaim: "cognito:groups",
//                         provider: "userPools",
//                         allow: "groups",
//                         groups: ["SYSTEM_ADMIN"],
//                         operations: ["create", "update", "delete", "read"],
//                       },
//                       {
//                         allow: "public",
//                         provider: "iam",
//                         operations: ["read"],
//                       },
//                       { allow: "private", operations: ["read"] },
//                     ],
//                   },
//                 },
//               ],
//               primaryKeyInfo: {
//                 isCustomPrimaryKey: true,
//                 primaryKeyFieldName: "userId",
//                 sortKeyFieldNames: [],
//               },
//             },
//           },
//           enums: {
//             SystemItemType: {
//               name: "SystemItemType",
//               values: [
//                 "SETTING",
//                 "ROLE",
//                 "PERM",
//                 "ROLE_PERM",
//                 "USER_ROLE",
//                 "POLICY_VER",
//                 "SCOPES",
//                 "TENANT",
//                 "ORG_UNIT",
//               ],
//             },
//           },
//           nonModels: {},
//           queries: {
//             GetCognitoUser: {
//               name: "GetCognitoUser",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                 },
//               },
//             },
//             getOrgUnit: {
//               name: "getOrgUnit",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             getSettings: {
//               name: "getSettings",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             GetLambdaParameters: {
//               name: "GetLambdaParameters",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//             },
//             getTenant: {
//               name: "getTenant",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             getTenantBySlug: {
//               name: "getTenantBySlug",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             getTenantLookupBySlug: {
//               name: "getTenantLookupBySlug",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             listTenants: {
//               name: "listTenants",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//           },
//           mutations: {
//             CreateCognitoUser: {
//               name: "CreateCognitoUser",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                 },
//               },
//             },
//             SetCognitoUserPassword: {
//               name: "SetCognitoUserPassword",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                 },
//               },
//             },
//             createOrgUnit: {
//               name: "createOrgUnit",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             deleteOrgUnit: {
//               name: "deleteOrgUnit",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             updateOrgUnit: {
//               name: "updateOrgUnit",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             listOrgUnits: {
//               name: "listOrgUnits",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             clearSeeder: {
//               name: "clearSeeder",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             createTenant: {
//               name: "createTenant",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             deleteTenant: {
//               name: "deleteTenant",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             updateTenant: {
//               name: "updateTenant",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             seedTenants: {
//               name: "seedTenants",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: false,
//                 },
//               },
//             },
//             createUser: {
//               name: "createUser",
//               isArray: false,
//               type: "AWSJSON",
//               isRequired: false,
//               arguments: {
//                 inputString: {
//                   name: "inputString",
//                   isArray: false,
//                   type: "String",
//                   isRequired: true,
//                 },
//               },
//             },
//           },
//         },
//       },
//       version: "1.4",
//     },
//     themeProviderProps: {},
//   },
//   settings: {
//     public: {
//       general: { applicationName: "Cloudigniter" },
//       i18n: {
//         locales: [
//           { code: "en", name: "english" },
//           { code: "ar", name: "arabic" },
//         ],
//         defaultLocale: "en",
//         cookieName: "ci-locale",
//       },
//       theme: {
//         defaultTheme: "light",
//         storageKey: "ci-theme",
//         enableSystem: true,
//         enableColorScheme: true,
//         disableTransitionOnChange: false,
//         supportedThemes: ["light", "dark"],
//         attributeStrategy: "class",
//       },
//     },
//     private: {
//       security: { enable2FA: true },
//       email: { emailSender: "admin@example.com" },
//       mainMenu: [
//         {
//           id: "home",
//           label: "Home",
//           url: "/",
//           icon: "House",
//           hidden: false,
//           target: "_self",
//         },
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           url: "/dashboard",
//           icon: "LayoutDashboard",
//           hidden: false,
//           target: "_self",
//           subMenu: {
//             Development: {
//               id: "develope",
//               label: "Develope",
//               icon: "Code",
//               hidden: false,
//               target: "_self",
//               subMenu: {
//                 Sandbox: {
//                   id: "sandbox",
//                   label: "Sandbox",
//                   url: "/cp/dev/sandbox",
//                   icon: "Codesandbox",
//                   hidden: false,
//                   target: "_self",
//                 },
//                 Manual: {
//                   id: "manual",
//                   label: "Manual",
//                   url: "/cp/dev/manual",
//                   icon: "BookOpenText",
//                   hidden: false,
//                   target: "_self",
//                 },
//               },
//             },
//           },
//         },
//       ],
//     },
//     user: { locale: "en", theme: "standard", colorScheme: "light" },
//   },
//   headers: {
//     "x-ci-route-namespace": "/dashboard",
//     "x-ci-route-pathname": "/dashboard",
//     "x-ci-tenant-mode": "slug",
//     "x-ci-tenant-scope": "system",
//   },
//   cookies: {
//     "ci-locale": "en",
//     "ci-tenant-scope": "system",
//     "ci-tenant-mode": "slug",
//     "ci-route-namespace": "dashboard",
//     "ci-route-pathname": "/dashboard",
//   },
// };
