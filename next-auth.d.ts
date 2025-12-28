import "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
    interface User {
        role: UserRole;
    }
    interface Session {
        user: User;
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role: UserRole;
    }
}
