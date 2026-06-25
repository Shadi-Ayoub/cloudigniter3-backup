export function ciCapitalizeFirstLetter(
  str: string,
  allWords: boolean = false,
  skipSmallWords: boolean = false
): string {
  if (!str) return str; // Handle empty strings

  const smallWords = new Set(['the', 'of', 'for', 'and', 'in', 'on', 'at', 'by', 'to', 'a', 'an']);

  if (allWords) {
    return str
      .split(' ')
      .map((word, index) => {
        // Skip small words if not the first word
        if (skipSmallWords && index !== 0 && smallWords.has(word.toLowerCase())) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  // Capitalize only the first letter of the string
  return str.charAt(0).toUpperCase() + str.slice(1);
}
