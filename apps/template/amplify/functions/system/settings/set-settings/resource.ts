import { defineFunction } from '@aws-amplify/backend';

export const setSettingsHandler = defineFunction({
  name: 'set-settings-handler',
  resourceGroupName: 'data',
});
