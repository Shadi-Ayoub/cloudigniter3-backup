import { AppHttpErrorPage } from "@/custom/errors/AppHttpErrorPage";

export default function Forbidden() {
  return <AppHttpErrorPage statusCode={403} />;
}
