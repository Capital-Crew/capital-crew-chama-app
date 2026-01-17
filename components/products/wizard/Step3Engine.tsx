import { useFormContext } from "react-hook-form";
import { LoanProductWizardValues } from "@/lib/schemas/loan-product-schema";
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "./WizardUI";

export function Step3Engine() {
    const { register, formState: { errors } } = useFormContext<LoanProductWizardValues>();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Engine Configuration</CardTitle>
                <CardDescription>Configure how interest and penalties are calculated.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Interest Engine */}
                <div className="space-y-4 border-b border-slate-100 pb-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Interest Engine</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="interestRatePerPeriod">Nominal Interest Rate (%)</Label>
                            <Input id="interestRatePerPeriod" type="number" step="0.01" {...register("interestRatePerPeriod")} />
                            <p className="text-[10px] text-slate-500">Rate per period (e.g. per Month)</p>
                            {errors.interestRatePerPeriod && <p className="text-xs text-red-500">{errors.interestRatePerPeriod.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="interestType">Calculation Method</Label>
                            <select
                                id="interestType"
                                {...register("interestType")}
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                            >
                                <option value="DECLINING_BALANCE">Declining Balance</option>
                                <option value="FLAT">Flat Rate</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amortizationType">Amortization</Label>
                            <select
                                id="amortizationType"
                                {...register("amortizationType")}
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                            >
                                <option value="EQUAL_INSTALLMENTS">Equal Installments (Annuity)</option>
                                <option value="EQUAL_PRINCIPAL">Equal Principal (Reducing)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="interestCalculationPeriodType">Interest Period</Label>
                            <select
                                id="interestCalculationPeriodType"
                                {...register("interestCalculationPeriodType")}
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                            >
                                <option value="SAME_AS_REPAYMENT">Same as Repayment</option>
                                <option value="DAILY">Daily</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Penalty Engine */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Penalty Engine</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="defaultPenaltyRate">Overdue Penalty Rate (%)</Label>
                            <Input id="defaultPenaltyRate" type="number" step="0.01" {...register("defaultPenaltyRate")} />
                            <p className="text-[10px] text-slate-500">% of overdue installment amount</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                            <Input id="gracePeriod" type="number" {...register("gracePeriod")} />
                            <p className="text-[10px] text-slate-500">Days before penalty applies</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
