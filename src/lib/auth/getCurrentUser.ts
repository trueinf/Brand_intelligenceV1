/**
 * Returns the current authenticated user for API routes.
 * Throws if not logged in.
 * Replace the implementation with your auth provider (NextAuth, Clerk, etc.).
 */

export interface CurrentUser {
  id: string;
}

const USER_ID_HEADER = "x-user-id";

export function getCurrentUser(request: Request): CurrentUser {
  const userId = request.headers.get(USER_ID_HEADER)?.trim();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return { id: userId };
}
