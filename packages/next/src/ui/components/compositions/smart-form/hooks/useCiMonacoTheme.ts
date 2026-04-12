import { useEffect, useState } from 'react';

export function useCiMonacoTheme(): 'cloudigniter-dark' | 'cloudigniter-light' {
  const [theme, setTheme] = useState<'cloudigniter-dark' | 'cloudigniter-light'>('cloudigniter-light');

  useEffect(() => {
    const detect = () =>
      document.documentElement.classList.contains('dark') ? 'cloudigniter-dark' : 'cloudigniter-light';

    setTheme(detect());

    const observer = new MutationObserver(() => {
      setTheme(detect());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
