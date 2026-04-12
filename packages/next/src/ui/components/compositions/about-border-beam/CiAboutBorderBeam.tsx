import { ciStartTrace } from "@/.";
import { BorderBeam, Card } from "@/ui/components";
import { type CiAboutBorderBeamProps } from "./types";

export function CiAboutBorderBeam({
  config,
  title,
  primaryText,
  secondaryText,
  options,
}: CiAboutBorderBeamProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<AboutBorderBeam>" },
  );

  logger.log({
    scope: "UI",
    event: `Rendering the <AboutBorderBeam> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className="ci-about-border-beam">
      <Card className="ci-about-border-beam-box">
        <span className="ci-about-border-beam-title">
          {title ?? "Cloudigniter"}
        </span>
        <span className="ci-about-border-beam-primary-text">
          {primaryText ??
            "A Comprehensive Platform, Toolbox, and Framework for developing & deploying Applications on AWS"}
        </span>
        <span className="ci-about-border-beam-secondary-text">
          {secondaryText ??
            "CloudIgniter is a cutting-edge development platform, toolbox, and framework designed for building scalable, secure, and customizable applications on Amazon Web Services (AWS). It empowers developers by simplifying complex AWS services integration while maintaining flexibility for custom implementations."}
        </span>
        <BorderBeam {...options} />
      </Card>
    </div>
  );
}
