const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`
  for (const part of document.cookie.split(';')) {
    const item = part.trim()
    if (item.startsWith(prefix)) {
      return decodeURIComponent(item.slice(prefix.length))
    }
  }
  return null
}

export function writeCookie(
  name: string,
  value: string,
  maxAge = COOKIE_MAX_AGE,
) {
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'SameSite=Lax',
  ].join('; ')
}
