import type { SVGProps } from "react";

/** Original 17:13 brand proportions, fitted inside the Beacon icon area. */
export function CiDevBeaconIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={28}
      height={28}
      viewBox="0 0 34 26"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M10.1 20.7H7.2C3.7 20.7 0.9 18.3 0.9 14.9C0.9 12.1 2.7 9.7 5.3 8.9C5.9 6.1 8.7 4.1 11.6 5.9C13.3 2.3 16.4 0.3 19.6 0.8C23.7 1.1 27 4.4 27.1 9.7H27.7C30.8 9.7 33.3 12.1 33.3 15.1C33.3 18.2 30.8 20.7 27.6 20.7H22.6" />
      <path d="M17.7 6.8C18.3 11.2 22.3 13 22.3 18C22.3 22.3 20.7 25.1 16.9 25.1C13.4 25.1 10.8 22.5 10.8 19.5C10.8 17.7 11 16.3 11.8 15.2C12.5 16.9 13.2 18.4 14.5 18.8C13.7 16.7 14.2 13.6 15 11.1C15.7 9 16.7 7.4 17.7 6.8Z" />
    </svg>
  );
}
