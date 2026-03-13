// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Session, User } from "@auth/core/types";

declare module "@auth/core/types" {
  interface Session {
    user?: (User & { id?: string; isAdmin?: boolean }) | null;
  }

  interface User {
    id?: string;
    isAdmin?: boolean;
  }
}

export type MatheSession = Session;
