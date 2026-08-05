import { cn } from "@cloudigniter/ui/client";

interface CiDevBeaconCardRowSeparatorProps {
  line?: boolean;
}

export function CiDevBeaconCardRowSeparator({ line = false }: CiDevBeaconCardRowSeparatorProps) {
  const lineClass = line ? "my-3 border-t" : "mt-6 mb-3";

  return <div className={cn(lineClass)} />;
}
