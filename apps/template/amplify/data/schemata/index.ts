import schemaCognitoUser from "./schema-cognito-user";
import schemaEmberguard from "./schema-emberguard";
// import schemaOU from './schema-ou';
// import schemaSeeder from './schema-seeder';
// import schemaSettings from './settings/schema-settings';
// import schemaPublicSettings from './settings/schema-public-settings';
// import schemaPrivateSettings from './settings/schema-private-settings';
// import schemaUserSettings from './settings/schema-user-settings';
// import schemaSystem from "./schema-system";
// import schemaTenant from './schema-tenant';
import schemaUser from "./schema-user";

import { customDataSchemas } from "../../custom/backend";

const coreSchemas = {
  ...schemaCognitoUser,
  ...schemaEmberguard,
  // ...schemaOU,
  // ...schemaSeeder,
  // ...schemaSettings,
  // ...schemaPublicSettings,
  // ...schemaPrivateSettings,
  // ...schemaUserSettings,
  // ...schemaSystem,
  // ...schemaTenant,
  ...schemaUser,
};

export { coreSchemas, customDataSchemas as extendedSchemas };
