import { MembersModule } from "@/components/member/MembersModule"
import { auth } from "@/auth"
import { getMemberFullDetail } from "@/app/actions/member-dashboard-actions"
import { getMembers } from "@/app/actions/get-members"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { getCurrentUserPermissions } from "@/app/actions/user-permissions"
import { protectPage } from "@/lib/with-module-protection"

interface PageProps {
    searchParams: Promise<{ id?: string }>
}

export default async function MembersPage({ searchParams }: PageProps) {
    const { id: queryId } = await searchParams;
    const session = await auth();

    if (!session?.user) {
        redirect("/")
    }

    if (!await protectPage('MEMBERS')) return redirect('/dashboard')

    const { role, memberId } = session.user as { role: UserRole, memberId?: string };

    const normalizedRole = (role as string)?.toUpperCase().replace(/\s+/g, '_') || '';
    const isPrivileged = [
        'SYSTEM_ADMIN',
        'CHAIRPERSON',
        'TREASURER',
        'SECRETARY',
        'SYSTEM_ADMINISTRATOR'
    ].includes(normalizedRole);

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

    // Fetch members and permissions in parallel
    const [members, permRes] = await Promise.all([
        getMembers(),
        getCurrentUserPermissions()
    ]);

    let initialDetail = null;
    if (members.length > 0) {
        // Priority: 1. URL Query ID (Admin directory) 2. Auth memberId (Member view) 3. First member (Admin default)
        const targetId = queryId || (isPrivileged ? members[0].id : memberId);
        if (targetId) {
            initialDetail = await getMemberFullDetail(targetId);
        }
    }


    return (
        <MembersModule
            initialMembers={members}
            initialDetail={initialDetail}
            userRole={role}
            currentUserId={session.user.id!}
            currentUserPermissions={permRes?.permissions}
        />
    )
}
