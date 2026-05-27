import { a } from '@aws-amplify/backend';

import { getOrgUnitHandler } from '../../functions/system/ou/get-ou/resource';
import { createOrgUnitHandler } from '../../functions/system/ou/create-ou/resource';
import { deleteOrgUnitHandler } from '../../functions/system/ou/delete-ou/resource';
import { updateOrgUnitHandler } from '../../functions/system/ou/update-ou/resource';
import { listOrgUnitsHandler } from '../../functions/system/ou/list-ous/resource';

const schemaOU = {
  getOrgUnit: a
    .query()
    .arguments({
      inputString: a.string(),
    })
    .handler(a.handler.function(getOrgUnitHandler))
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()]),

  createOrgUnit: a
    .mutation()
    .arguments({
      inputString: a.string(),
    })
    .handler(a.handler.function(createOrgUnitHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

  deleteOrgUnit: a
    .mutation()
    .arguments({
      inputString: a.string(),
    })
    .handler(a.handler.function(deleteOrgUnitHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

  updateOrgUnit: a
    .mutation()
    .arguments({
      inputString: a.string(),
    })
    .handler(a.handler.function(updateOrgUnitHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

  listOrgUnits: a
    .mutation()
    .arguments({
      inputString: a.string(),
    })
    .handler(a.handler.function(listOrgUnitsHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),
};

export default schemaOU;
