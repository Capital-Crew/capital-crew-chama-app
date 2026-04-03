import { StepSkeleton } from '@/components/ui/StepSkeleton'

export default function Loading() {
    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            <StepSkeleton />
        </div>
    )
}
