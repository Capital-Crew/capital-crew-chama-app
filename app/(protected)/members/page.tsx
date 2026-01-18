import { MemberManagementMaster } from "@/components/member/MemberManagementMaster"
import { auth } from "@/auth"
import { getMemberFullDetail } from "@/app/actions/member-dashboard-actions"
import { getMembers } from "@/app/actions/get-members"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"

export default async function MembersPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/")
    }

    const { role, memberId } = session.user as { role: UserRole, memberId?: string };

    const privilegedRoles = [
        UserRole.SYSTEM_ADMIN,
        UserRole.CHAIRPERSON,
        UserRole.TREASURER,
        UserRole.SECRETARY
    ];

    const isPrivileged = privilegedRoles.includes(role as any);

    // REDIRECT LOGIC: Restricted users go to their own profile
    if (!isPrivileged) {
        if (memberId) {
            redirect(`/members/${memberId}`)
        } else {
            // Edge case: User has no memberId linked (or is in setup)
            // Redirect to dashboard or show unauthorized
            redirect("/dashboard")
        }
    }

    // Fetch members using the secure Server Action/Function
    const members = await getMembers();

    let initialDetail = null;
    if (members.length > 0) {
        initialDetail = await getMemberFullDetail(members[0].id);
    }

    return (
        <MemberManagementMaster
            initialMembers={members}
            initialDetail={initialDetail}
            userRole={role}
        />
    )
}
