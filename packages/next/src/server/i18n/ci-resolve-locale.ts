import { deepmerge } from 'deepmerge-ts';
import { type AbstractIntlMessages } from 'next-intl';

export function ciResolveLocale(
  commonMessages: AbstractIntlMessages,
  customCommonMessages: AbstractIntlMessages,
  publicMessages: AbstractIntlMessages,
  customPublicMessages: AbstractIntlMessages,
  namespaceMessages: AbstractIntlMessages,
  customNamespaceMessages: AbstractIntlMessages
) {
  // System JSON first to allow developers to override translations!
  const messages = deepmerge(
    commonMessages, // this is first
    customCommonMessages, // this is second
    publicMessages,
    customPublicMessages,
    namespaceMessages,
    customNamespaceMessages // can have translations that overlap with the common. In this case, commons will be overridden!
  ) as AbstractIntlMessages;

  return messages;
}
