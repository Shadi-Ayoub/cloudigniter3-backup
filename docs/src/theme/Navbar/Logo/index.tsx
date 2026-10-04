import React from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import type { ThemeConfig } from "@docusaurus/preset-classic";
import ThemedImage from "@theme/ThemedImage";

/** Share the two-tone wordmark across the desktop navbar and mobile menu. */
export default function NavbarLogo(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const { navbar } = siteConfig.themeConfig as ThemeConfig;
  const title = navbar.title ?? siteConfig.title;
  const logo = navbar.logo;
  const href = useBaseUrl(logo?.href ?? "/");
  const sources = {
    light: useBaseUrl(logo?.src ?? "img/logo.png"),
    dark: useBaseUrl(logo?.srcDark ?? logo?.src ?? "img/logo.png"),
  };
  const hasDocsSuffix = title.endsWith(" Docs");

  return (
    <Link
      className="navbar__brand"
      to={href}
      aria-label={title}
      target={logo?.target}
    >
      <div className="navbar__logo">
        <ThemedImage alt="" sources={sources} />
      </div>
      <b className="navbar__title text--truncate">
        {hasDocsSuffix ? (
          <>
            {title.slice(0, -5)} <span className="ci-navbar-docs">Docs</span>
          </>
        ) : (
          title
        )}
      </b>
    </Link>
  );
}
