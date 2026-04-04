const FLAG_MAP: Record<string, string> = {
  'INDIA': '🇮🇳',
  'CHINA': '🇨🇳',
  'PAKISTAN': '🇵🇰',
  'USA': '🇺🇸',
  'UNITED STATES': '🇺🇸',
  'RUSSIA': '🇷🇺',
  'UKRAINE': '🇺🇦',
  'TAIWAN': '🇹🇼',
  'IRAN': '🇮🇷',
  'ISRAEL': '🇮🇱',
  'UK': '🇬🇧',
  'UNITED KINGDOM': '🇬🇧',
  'FRANCE': '🇫🇷',
  'GERMANY': '🇩🇪',
  'JAPAN': '🇯🇵',
  'SOUTH KOREA': '🇰🇷',
  'NORTH KOREA': '🇰🇵',
  'AUSTRALIA': '🇦🇺',
  'CANADA': '🇨🇦',
  'BRAZIL': '🇧🇷',
  'SOUTH AFRICA': '🇿🇦',
  'SAUDI ARABIA': '🇸🇦',
  'UAE': '🇦🇪',
  'SRI LANKA': '🇱🇰',
  'BANGLADESH': '🇧🇩',
  'NEPAL': '🇳🇵',
  'AFGHANISTAN': '🇦🇫',
  'MEXICO': '🇲🇽',
  'INDONESIA': '🇮🇩',
  'VIETNAM': '🇻🇳',
  'PHILIPPINES': '🇵🇭',
  'TURKEY': '🇹🇷',
  'TÜRKIYE': '🇹🇷',
  'EGYPT': '🇪🇬',
  'ARGENTINA': '🇦🇷',
  'COLOMBIA': '🇨🇴',
  'EU': '🇪🇺',
  'EUROPEAN UNION': '🇪🇺',
  'SINGAPORE': '🇸🇬',
  'MALAYSIA': '🇲🇾',
  'THAILAND': '🇹🇭',
  'IRAQ': '🇮🇶',
  'SYRIA': '🇸🇾',
  'YEMEN': '🇾🇪',
  'QATAR': '🇶🇦',
  'KUWAIT': '🇰🇼',
  'OMAN': '🇴🇲',
  'NIGERIA': '🇳🇬',
  'KENYA': '🇰🇪',
  'ETHIOPIA': '🇪🇹',
}

export function applyFlag(label: any): string {
  if (!label) return String(label || '');
  const lblStr = String(label);
  const upper = lblStr.toUpperCase();
  for (const [key, flag] of Object.entries(FLAG_MAP)) {
    if (upper === key || upper.includes(` ${key} `) || upper.startsWith(`${key} `) || upper.endsWith(` ${key}`)) {
      return `${flag} ${lblStr}`;
    }
  }
  return lblStr;
}
