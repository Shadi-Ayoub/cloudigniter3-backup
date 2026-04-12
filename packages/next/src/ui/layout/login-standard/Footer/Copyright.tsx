import { useTranslations } from 'next-intl';
import { capitalizeFirstLetter } from '@CI/utility/common/capitalize-first-letter';

const Copyright = () => {
  const t = useTranslations('mainFooter');

  return (
    <div className='flex w-full items-center justify-center text-center text-sm ltr:flex-row rtl:flex-row-reverse'>
      <span>&copy;</span>&nbsp;
      <span>{new Date().getFullYear()}</span>&nbsp;
      <bdi dir='ltr'>CloudIgniter</bdi>
      <span dir='ltr'>.</span>&nbsp;
      <span>{capitalizeFirstLetter(t('all rights reserved'))}</span>
    </div>
  );
};

export { Copyright };
