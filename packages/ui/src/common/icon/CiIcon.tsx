import { Icon } from "@iconify/react";
import { ciResolveIcon } from "@cloudigniter/core/lib";

export function CiIcon({
  name,
  appRegistry,
  className,
}: {
  name: string;
  appRegistry?: Record<string, string>;
  className?: string;
}) {
  const icon = ciResolveIcon(name, appRegistry);

  if (!icon) {
    return null;
  }

  return <Icon icon={icon} className={className} />;
}
