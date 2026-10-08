import { a } from "@aws-amplify/backend";
import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "../../../backend/ci-core-amplify-manifest";
const { getSettingsHandler, setSettingsHandler } = CI_CORE_AMPLIFY_FUNCTION_RESOURCES;
export default {
  GetSettings: a.query().arguments({ inputString: a.string().required() })
    .handler(a.handler.function(getSettingsHandler)).returns(a.json())
    .authorization(allow => [allow.publicApiKey(), allow.authenticated()]),
  SetSettings: a.mutation().arguments({ inputString: a.string().required() })
    .handler(a.handler.function(setSettingsHandler)).returns(a.json())
    .authorization(allow => [allow.authenticated()]),
};
