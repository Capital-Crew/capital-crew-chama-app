import { NextOfKinForm } from '@/components/member/forms/NextOfKinForm'

export default function NextOfKinTab({ memberId, beneficiaries }: { memberId: string, beneficiaries: any[] }) {
    return (
        <div className="max-w-4xl mx-auto">
            <NextOfKinForm memberId={memberId} initialData={beneficiaries} />
        </div>
    )
}
