import { a } from "@aws-amplify/backend";
import { manageModulesHandler } from "../../functions/system/modules/manage/resource";
import { executeModuleHandler } from "../../functions/system/modules/execute/resource";

export default {
  ManageModules: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(manageModulesHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group("developer")]),
  ExecuteModule: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(executeModuleHandler))
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()]),
};
