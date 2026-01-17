
import { UserRole } from "@prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            memberId: string
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
        memberId: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        memberId: string
    }
}
