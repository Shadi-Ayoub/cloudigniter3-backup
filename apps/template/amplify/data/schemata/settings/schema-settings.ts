import { a } from '@aws-amplify/backend';

import { getSettingsHandler } from '../../../functions/system/settings/get-settings/resource';
import { setSettingsHandler } from '../../../functions/system/settings/set-settings/resource';

const schemaSettings = {
  getSettings: a
    .query()
    .arguments({
      inputString: a.string(),
    })
    .handler(a.handler.function(getSettingsHandler))
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()]),

  setSettings: a
    .mutation()
    .arguments({
      inputString: a.string(),
    })
    .handler(a.handler.function(setSettingsHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),
};

export default schemaSettings;
