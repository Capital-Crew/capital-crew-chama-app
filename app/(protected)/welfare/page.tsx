import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { getWelfareTypes } from '@/app/welfare-types-actions'
import { getWelfareRequisitions } from '@/app/welfare-requisition-actions'
import { getMembers } from '@/app/actions/get-members'
import { WelfareRequisitionForm } from '@/components/welfare/WelfareRequisitionForm'
import { WelfareHistory } from '@/components/welfare/WelfareHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function WelfarePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
    }

    // Get user with member details
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    if (!user?.member) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
                    Access Denied: You must be a registered member to access Welfare services.
                </div>
            </div>
        )
    }

    // Role Logic
    const allowedRoles = ['CHAIRPERSON', 'SECRETARY', 'TREASURER', 'SYSTEM_ADMIN']
    const isExec = allowedRoles.includes(session.user.role || '')

    // Fetch Data
    const typesRes = await getWelfareTypes(false) // Active only
    const welfareTypes = typesRes.success ? typesRes.data : []

    // Fetch Claims: "All members can see the list of Pending and Approved claims"
    // So we fetch ALL for everyone.
    const historyRes = await getWelfareRequisitions('ALL')
    const requisitions = historyRes.success ? (historyRes.data || []) : []

    // Fetch Members for Selector (Only needed for Execs)
    let membersList: any[] = []
    if (isExec) {
        membersList = await getMembers()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welfare & Benefits</h1>
                <p className="text-muted-foreground">
                    {isExec
                        ? 'Manage welfare requisitions and track claims.'
                        : 'Track welfare claims and benefits.'}
                </p>
            </div>

            {isExec ? (
                <Tabs defaultValue="claims" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="claims">Welfare Claims</TabsTrigger>
                        <TabsTrigger value="new">New Requisition</TabsTrigger>
                    </TabsList>

                    <TabsContent value="claims">
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                                <p className="text-sm text-blue-800">
                                    <strong>Executive Access:</strong> As an executive, you can create new claims on behalf of members and manage approvals.
                                </p>
                            </div>
                            <WelfareHistory requisitions={requisitions} />
                        </div>
                    </TabsContent>

                    <TabsContent value="new" className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <WelfareRequisitionForm
                                welfareTypes={welfareTypes}
                                members={membersList}
                            />

                            <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-lg border">
                                    <h3 className="font-semibold mb-2">How it works</h3>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
                                        <li>Select the beneficiary member.</li>
                                        <li>Select the type of benefit properly.</li>
                                        <li>Provide the requested amount and details.</li>
                                        <li>Attach any supporting information if required.</li>
                                        <li>Once submitted, the committee will review.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="space-y-6">
                    {/* Member View - Only History/Claims */}
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <p className="text-sm text-slate-600">
                            Below is the list of all welfare claims. For new requests, please contact the Welfare Committee.
                        </p>
                    </div>
                    <WelfareHistory requisitions={requisitions} />
                </div>
            )}
        </div>
    )
}
