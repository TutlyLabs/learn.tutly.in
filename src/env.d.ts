/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import("./lib/auth/session").SessionUser | null;
    session: import("./lib/auth/session").SessionWithUser | null;
    organization: import("@prisma/client").Organization | null;
    role: import("@prisma/client").Role | null;
  }
}
