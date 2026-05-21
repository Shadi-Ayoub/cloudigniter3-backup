import CiLayout from "@cloudigniter/next/layout/app-standard";
import { CiPage } from "@cloudigniter/next";
import { CiAboutBorderBeam } from "@cloudigniter/core/client";

// import { ciBootstrap } from "@/kernel/server";

export default async function HomePage() {
  // const config = await ciBootstrap();

  return (
    <>
      <p>Hello</p>
      {/* <CiLayout config={config} protect={false}>
        <CiPage
          name={"homepage"}
          setup={{ showPageHeader: false }}
          config={config}
        >
          <CiAboutBorderBeam
            traceConfig={config}
            options={{ duration: 8, size: 200 }}
          />
        </CiPage>
      </CiLayout> */}
    </>
  );
}
