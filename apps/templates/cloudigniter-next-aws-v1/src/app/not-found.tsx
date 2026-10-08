import { AppHttpErrorPage } from "@/custom/errors/AppHttpErrorPage";

export default function NotFound() {
  return <AppHttpErrorPage statusCode={404} />;
}
