export const privateDisplayNameMigration = `
-- Repair the historical sign-in-email fallback without changing auth emails.
-- Restrict to exact matches; preserve unrelated user-selected display names.
UPDATE users SET name='FlexTab Member', "updatedAt"=now()
WHERE email IS NOT NULL AND trim(email)<>'' AND lower(trim(name))=lower(trim(email));
`;
