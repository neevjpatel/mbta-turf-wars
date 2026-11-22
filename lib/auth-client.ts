// Google sign-in, browser side. Talks to app/api/auth/[...all]/route.ts.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
