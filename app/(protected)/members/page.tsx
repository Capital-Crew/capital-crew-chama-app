
import prisma from "@/lib/prisma"
import { MemberRegistry } from "@/components/MemberRegistry"

export default async function MembersPage() {
    const members = await prisma.member.findMany({ orderBy: { memberNumber: 'asc' } })
    return <MemberRegistry members={members} />
}
