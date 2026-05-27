"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@cloudigniter/core/client";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const CiSettingsFormSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={className ?? "space-y-4"}>{children}</CardContent>
    </Card>
  );
};
