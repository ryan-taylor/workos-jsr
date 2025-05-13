import type { DirectoryUser } from "../interfaces/directory-user.interface.ts.ts";

export function getPrimaryEmail(user: DirectoryUser): string | undefined {
  const primaryEmail = user.emails?.find((email) => email.primary);
  return primaryEmail?.value;
}
