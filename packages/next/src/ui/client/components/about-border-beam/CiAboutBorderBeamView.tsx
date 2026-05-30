"use client";

import {
  BorderBeam,
  Card,
  type CiAboutBorderBeamViewProps,
} from "@ci-next/ui/client";

export function CiAboutBorderBeamView({
  title,
  primaryText,
  secondaryText,
  options,
}: CiAboutBorderBeamViewProps) {
  return (
    <div className="ci-about-border-beam">
      <Card className="ci-about-border-beam-box">
        <span className="ci-about-border-beam-title">
          {title ?? "CloudIgniter"}
        </span>

        <span className="ci-about-border-beam-primary-text">
          {primaryText ??
            "A Comprehensive Platform, Toolbox, and Framework for developing & deploying Applications on AWS"}
        </span>

        <span className="ci-about-border-beam-secondary-text">
          {secondaryText ??
            "CloudIgniter is a cutting-edge development platform, toolbox, and framework designed for building scalable, secure, and customizable applications on Amazon Web Services (AWS)."}
        </span>

        <BorderBeam {...options} />
      </Card>
    </div>
  );
}
