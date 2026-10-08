import { a } from "@aws-amplify/backend";
import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "../../backend/ci-core-amplify-manifest";

const {
  createOrgUnitHandler,
  getOrgUnitByPathHandler,
  listOrgUnitsHandler,
  updateOrgUnitHandler,
} = CI_CORE_AMPLIFY_FUNCTION_RESOURCES;

const schemaOrgUnit = {
  ListOrgUnits: a
    .query()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(listOrgUnitsHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
  GetOrgUnitByPath: a
    .query()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(getOrgUnitByPathHandler))
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()]),
  CreateOrgUnit: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(createOrgUnitHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
  UpdateOrgUnit: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(updateOrgUnitHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
};

export default schemaOrgUnit;
