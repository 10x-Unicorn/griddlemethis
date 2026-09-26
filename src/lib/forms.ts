/** Stricter than the browser's built-in email check, which accepts "a@b": requires a domain ending like ".com". */
export const EMAIL_PATTERN = String.raw`[^@\s]+@[^@\s]+\.[^@\s]+`;
export const EMAIL_HINT = 'Enter an email address like name@example.com';
