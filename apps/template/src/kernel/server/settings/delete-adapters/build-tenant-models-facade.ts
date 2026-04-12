import type { Schema } from '@/../amplify/data/resource';
import type {
  TenantSettingCreateInput,
  TenantSettingItem,
  TenantSettingKey,
} from './amplify-setting-shapes';
import type { AmplifyModel } from './amplify-model-types';

type DataClient = ReturnType<
  typeof import('aws-amplify/data').generateClient<Schema>
>;

/**
 * Build the strongly typed tenant models facade from the Amplify client.
 */
export function buildTenantModelsFacade(client: DataClient): {
  PublicSetting: AmplifyModel<
    TenantSettingItem,
    TenantSettingKey,
    TenantSettingCreateInput
  >;
  PrivateSetting: AmplifyModel<
    TenantSettingItem,
    TenantSettingKey,
    TenantSettingCreateInput
  >;
} {
  // These casts are NOT `any`; they are concrete generics.
  // If your Schema model types differ, adjust TenantSettingItem accordingly.
  return {
    PublicSettings: client.models.PublicSettings as unknown as AmplifyModel<
      TenantSettingItem,
      TenantSettingKey,
      TenantSettingCreateInput
    >,
    PrivateSettings: client.models.PrivateSettings as unknown as AmplifyModel<
      TenantSettingItem,
      TenantSettingKey,
      TenantSettingCreateInput
    >,
  };
}
