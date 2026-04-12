import Layout from '@cloudigniter/next/ui/layout/app-standard';
import { Page } from '@cloudigniter/next/ui/layout';
import { AboutBorderBeam } from '@cloudigniter/next/ui/components';

import { ciBootstrap } from '@/kernel/server';

export default async function HomePage() {
  const config = await ciBootstrap();

  return (
    <>
      <Layout config={config} protect={false}>
        <Page
          name={'homepage'}
          setup={{ showPageHeader: false }}
          config={config}
        >
          <AboutBorderBeam
            config={config}
            options={{ duration: 8, size: 200 }}
          />
        </Page>
      </Layout>
    </>
  );
}
