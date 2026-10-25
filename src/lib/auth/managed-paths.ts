/** App-managed mutations require live availability checks, validation and atomic audit.
 * Disable only public HTTP alternatives; sign-in, session validation and sign-out remain provider-owned.
 */
export const managedIdentityPaths = [
  "/sign-in/email",
  "/update-user",
  "/change-password",
  "/revoke-session",
  "/revoke-sessions",
  "/revoke-other-sessions",
];
