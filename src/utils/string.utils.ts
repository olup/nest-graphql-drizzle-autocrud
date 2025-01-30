export function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function toCamelCase(...words: string[]) {
  words = words.map((word) => word.split('_')).flat();
  const result = words.map((word) => capitalize(word)).join('');
  return result.charAt(0).toLowerCase() + result.slice(1);
}
