import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

export interface CiPageHeaderActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  icon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
}
