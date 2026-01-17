import { useFormContext } from "react-hook-form";
import { LoanProductWizardValues } from "@/lib/schemas/loan-product-schema";
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "./WizardUI";

export function Step2Terms() {
    const { register, formState: { errors } } = useFormContext<LoanProductWizardValues>();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Terms & Limits</CardTitle>
                <CardDescription>Define the borrowing limits and repayment schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Principal Limits */}
                <div className="space-y-4 border-b border-slate-100 pb-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Principal Amounts</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="minPrincipal">Min</Label>
                            <Input id="minPrincipal" type="number" {...register("minPrincipal")} />
                            {errors.minPrincipal && <p className="text-xs text-red-500">{errors.minPrincipal.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="principal">Default</Label>
                            <Input id="principal" type="number" {...register("principal")} />
                            {errors.principal && <p className="text-xs text-red-500">{errors.principal.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxPrincipal">Max</Label>
                            <Input id="maxPrincipal" type="number" {...register("maxPrincipal")} />
                            {errors.maxPrincipal && <p className="text-xs text-red-500">{errors.maxPrincipal.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Repayment Terms */}
                <div className="space-y-4 border-b border-slate-100 pb-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Repayment Period</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="minRepaymentTerms">Min Terms</Label>
                            <Input id="minRepaymentTerms" type="number" {...register("minRepaymentTerms")} />
                            {errors.minRepaymentTerms && <p className="text-xs text-red-500">{errors.minRepaymentTerms.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="numberOfRepayments">Default Terms</Label>
                            <Input id="numberOfRepayments" type="number" {...register("numberOfRepayments")} />
                            {errors.numberOfRepayments && <p className="text-xs text-red-500">{errors.numberOfRepayments.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxRepaymentTerms">Max Terms</Label>
                            <Input id="maxRepaymentTerms" type="number" {...register("maxRepaymentTerms")} />
                            {errors.maxRepaymentTerms && <p className="text-xs text-red-500">{errors.maxRepaymentTerms.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Frequency */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Repayment Frequency</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="repaymentEvery">Every (Count)</Label>
                            <Input id="repaymentEvery" type="number" {...register("repaymentEvery")} />
                            <p className="text-[10px] text-slate-500">e.g., Every '1' Month</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="repaymentFrequencyType">Unit</Label>
                            <select
                                id="repaymentFrequencyType"
                                {...register("repaymentFrequencyType")}
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                            >
                                <option value="MONTHLY">Monthly</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="DAILY">Daily</option>
                            </select>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
