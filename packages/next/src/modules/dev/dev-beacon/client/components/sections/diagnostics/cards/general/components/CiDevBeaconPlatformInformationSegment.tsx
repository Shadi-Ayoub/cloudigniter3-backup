import type { CiNextAppConfig } from "@cloudigniter/next/types";
import { CiDevBeaconCardRowGrid, CiDevBeaconCardRow } from "@ci-next/modules/dev/dev-beacon/client/components";

interface CiDevBeaconPlatformInformationSegmentProps {
  config: CiNextAppConfig;
}

export function CiDevBeaconPlatformInformationSegment({ config }: CiDevBeaconPlatformInformationSegmentProps) {
  const platform = config.platform ?? "UNKNOWN!";
  const platformVersion = config.version ?? "UNKNOWN!";
  const isNextJs = platform === "Next.js";

  return (
    <CiDevBeaconCardRowGrid title="Platform Information" columns={2} boxed={true} cellPadding="compact">
      <CiDevBeaconCardRow
        label="Platform Name"
        value={platform}
        url={config.url}
        tooltip="The application framework or platform detected from the resolved CloudIgniter configuration."
      />

      {isNextJs ? (
        <>
          <CiDevBeaconCardRow
            label="Platform Version"
            value={platformVersion}
            url={config.github}
            tooltip={<>The installed platform version currently used by the CloudIgniter application template.</>}
          />

          <CiDevBeaconCardRow
            label="Platform Runtime"
            value="App Router"
            tooltip={
              <>
                The routing system currently used by the application. Next.js supports the App Router and the Pages
                Router.
              </>
            }
          />
        </>
      ) : null}
    </CiDevBeaconCardRowGrid>
  );
}
