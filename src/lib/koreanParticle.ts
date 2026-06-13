/**
 * Returns the Korean directional particle (로/으로) for the given word.
 * Words ending in a vowel or the ㄹ final consonant take 로; all other
 * final consonants take 으로. Non-Hangul endings fall back to 로.
 */
export function directionalParticle(word: string): "로" | "으로" {
  const lastChar = word.trim().slice(-1);
  const code = lastChar.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jongseong = (code - 0xac00) % 28;
    return jongseong === 0 || jongseong === 8 ? "로" : "으로";
  }
  return "로";
}
