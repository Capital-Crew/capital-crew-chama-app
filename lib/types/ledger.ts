export enum LedgerStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
    ARCHIVED = 'ARCHIVED'
}

export enum AccountType {
    ASSET = 'ASSET',
    LIABILITY = 'LIABILITY',
    EQUITY = 'EQUITY',
    REVENUE = 'REVENUE',
    EXPENSE = 'EXPENSE',
    INCOME = 'INCOME'
}

export enum NormalBalance {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT'
}

export enum AccountingPeriodStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    LOCKED = 'LOCKED'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    POSTED = 'POSTED',
    VOID = 'VOID'
}

export interface LedgerAccount {
    id: string;
    code: string;
    name: string;
    type: AccountType | string;
    balance: number | string;
    status: LedgerStatus | string;
    parentId: string | null;
    children?: LedgerAccount[];
    normalBalance: NormalBalance | string;
    updatedAt?: Date | string;
    createdAt?: Date | string;
    createdBy?: string | null;
    createdByName?: string | null;
    approvedBy?: string | null;
    approvedByName?: string | null;
}
