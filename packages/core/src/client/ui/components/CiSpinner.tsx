"use client";

import type { CiPageSpinnerProps } from "@/client";

export const CiSpinner = ({ text = "" }: CiPageSpinnerProps) => {
  return (
    <div id="page-loader" className="spinner-box">
      <div className="spinner-inner">
        <div className="spinner-animation"></div>
        <div className="spinner-label">{text}</div>
      </div>
    </div>
  );
};
