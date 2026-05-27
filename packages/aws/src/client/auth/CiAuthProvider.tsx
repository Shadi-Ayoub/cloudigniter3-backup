"use client";

import { type ReactNode } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
// import '@aws-amplify/ui-react/styles.css';

interface ProvidersProps {
  children: ReactNode;
}

export function CiAuthProvider({ children }: ProvidersProps) {
  return <Authenticator.Provider>{children}</Authenticator.Provider>;
}
