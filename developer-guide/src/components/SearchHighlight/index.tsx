import React from "react";

export default function SearchHighlight({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const terms = query.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!terms.length) return <>{text}</>;
  const expression = new RegExp(
    `(?<![\\p{L}\\p{N}])(${terms.sort((a, b) => b.length - a.length).join("|")})`,
    "giu",
  );
  return (
    <>
      {text
        .split(expression)
        .map((part, index) =>
          index % 2 ? <mark key={index}>{part}</mark> : part,
        )}
    </>
  );
}
