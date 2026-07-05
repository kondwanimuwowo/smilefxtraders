// E.164: leading +, country code (no leading 0), 8-15 digits total.
// e.g. +260971234567 (Zambia), +2348012345678 (Nigeria), +12025550123 (US)
export const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim());
}
