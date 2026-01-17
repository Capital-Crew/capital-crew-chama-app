import { useFormContext } from "react-hook-form";
import { LoanProductWizardValues } from "@/lib/schemas/loan-product-schema";
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "./WizardUI";

export function Step1General() {
    const { register, formState: { errors } } = useFormContext<LoanProductWizardValues>();

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Identity</CardTitle>
                <CardDescription>Basic information about the loan product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" placeholder="e.g. Development Loan" {...register("name")} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="shortCode">Short Code</Label>
                        <Input id="shortCode" placeholder="e.g. DL01" {...register("shortCode")} />
                        <p className="text-xs text-slate-500">Unique 3-4 char identifier for account generation.</p>
                        {errors.shortCode && <p className="text-sm text-red-500">{errors.shortCode.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <select
                            id="currency"
                            {...register("currency")}
                            className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                        >
                            <option value="KES">KES</option>
                            <option value="USD">USD</option>
                        </select>
                        {errors.currency && <p className="text-sm text-red-500">{errors.currency.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        {...register("description")}
                        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                        placeholder="Optional description..."
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                </div>
            </CardContent>
        </Card>
    )
}
