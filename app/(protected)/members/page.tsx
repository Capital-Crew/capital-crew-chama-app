import { MembersModule } from "@/components/member/MembersModule"
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
        UserRole.SECRETARY,
        'SYSTEM_ADMINISTRATOR' as any // Handle legacy/alternate role check
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
        // Optimization: For Admins, fetch first member. For Members, it's already their ID so fetch that.
        const targetId = isPrivileged ? members[0].id : memberId;
        if (targetId) {
            initialDetail = await getMemberFullDetail(targetId);
        }
    }

    // For normal members who might have been redirected here or land here directly
    // If they are not privileged, they should see their own data.
    // The redirect logic above might handle some cases, but if they land here, ensure we pass their own ID.

    return (
        <MembersModule
            initialMembers={members}
            initialDetail={initialDetail}
            userRole={role}
            currentUserId={session.user.id!}
        />
    )
}
