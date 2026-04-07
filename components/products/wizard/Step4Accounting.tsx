import { useFormContext } from "react-hook-form";
import { LoanProductWizardValues } from "@/lib/schemas/loan-product-schema";
import { Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "./WizardUI";

interface Account {
    id: string;
    name: string;
    code: string;
    type: string;
}

interface Step4AccountingProps {
    accounts: Account[];
}

export function Step4Accounting({ accounts }: Step4AccountingProps) {
    const { register, formState: { errors } } = useFormContext<LoanProductWizardValues>();



    const assetAccounts = accounts.filter(a => a.type === 'ASSET');
    const revenueAccounts = accounts.filter(a => a.type === 'REVENUE'); 

    const renderSelect = (name: keyof LoanProductWizardValues, label: string, filteredAccounts: Account[], placeholder: string) => (
        <div className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <select
                id={name}
                {...register(name)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="">Select Account...</option>
                {filteredAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                    </option>
                ))}
            </select>
            {errors[name] && <p className="text-xs text-red-500">{errors[name]?.message}</p>}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Accounting Mapping</CardTitle>
                <CardDescription>Map the financial flows to your General Ledger.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {}
                <div className="space-y-4 border-b border-slate-100 pb-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Asset Mapping</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderSelect("fundSourceAccountId", "Fund Source (Bank/Cash)", assetAccounts, "Select Asset Account")}
                        {renderSelect("loanPortfolioAccountId", "Loan Portfolio (Principal)", assetAccounts, "Select Asset Account")}
                    </div>
                </div>

                {}
                <div className="space-y-4 border-b border-slate-100 pb-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Interest Mapping</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderSelect("interestRevenueAccountId", "Interest Revenue", revenueAccounts, "Select Revenue Account")}
                        {renderSelect("interestReceivableAccountId", "Interest Receivable", assetAccounts, "Select Asset Account")}
                    </div>
                </div>

                {}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Penalty Mapping</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderSelect("penaltyRevenueAccountId", "Penalty Revenue", revenueAccounts, "Select Revenue Account")}
                        {renderSelect("penaltyReceivableAccountId", "Penalty Receivable", assetAccounts, "Select Asset Account")}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
