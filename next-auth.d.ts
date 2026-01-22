import "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
    interface User {
        role: UserRole;
        memberId?: string;
        mustChangePassword: boolean;
    }
    interface Session {
        user: User;
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role: UserRole;
        memberId?: string;
        mustChangePassword: boolean;
    }
}
