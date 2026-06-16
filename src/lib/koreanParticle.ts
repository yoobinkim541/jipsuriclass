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

/**
 * 히어로 회전 단어에 방향 조사(으로/로)가 이미 붙어 들어온 경우 떼어낸다.
 * (조사는 골드 강조 단어가 아니라 흰색 서술부로 따로 렌더하므로, 단어에서 분리해
 *  골드로 표시되지 않게 한다.) 분리 후 남는 단어가 있을 때만 떼어낸다.
 */
export function stripDirectionalParticle(word: string): string {
  const trimmed = word.trim();
  // "으로"/"로"뿐 아니라, 조사가 잘려 끝에 "으"만 매달려 들어온 경우("사진 몇 장으")도 떼어
  // 조사 전체가 골드 단어에서 분리되도록 한다.
  for (const particle of ["으로", "로", "으"] as const) {
    if (trimmed.length > particle.length && trimmed.endsWith(particle)) {
      return trimmed.slice(0, -particle.length).trimEnd();
    }
  }
  return trimmed;
}
