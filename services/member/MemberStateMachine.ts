import { MemberStatus } from '@prisma/client'

export class MemberStateMachine {
    private static transitions: Record<MemberStatus, MemberStatus[]> = {
        [MemberStatus.PENDING]: [MemberStatus.APPROVED, MemberStatus.REJECTED, MemberStatus.WITHDRAWN],
        [MemberStatus.APPROVED]: [MemberStatus.ACTIVE, MemberStatus.WITHDRAWN],
        [MemberStatus.ACTIVE]: [MemberStatus.CLOSED],
        [MemberStatus.REJECTED]: [],
        [MemberStatus.CLOSED]: [], // Strictly terminal for now
        [MemberStatus.WITHDRAWN]: []
    }

    /**
     * Check if a transition is valid
     */
    static canTransition(current: MemberStatus, next: MemberStatus): boolean {
        // If same status, technically not a transition, but allowed?
        // Usually no operation.
        if (current === next) return true;

        const validNext = this.transitions[current] || []
        return validNext.includes(next)
    }

    /**
     * Validate transition and throw error if invalid
     */
    static validateTransition(current: MemberStatus, next: MemberStatus): void {
        if (!this.canTransition(current, next)) {
            throw new Error(`Invalid member state transition from ${current} to ${next}`)
        }
    }

    static getInitialStatus(): MemberStatus {
        return MemberStatus.PENDING
    }
}
