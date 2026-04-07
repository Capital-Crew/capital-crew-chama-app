'use client'

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loanProductWizardSchema, LoanProductWizardValues, step1Schema, step2Schema, step3Schema, step4Schema } from "@/lib/schemas/loan-product-schema"
import { createLoanProductWizard } from "@/app/actions/loan-product"
import { StepIndicator, Button } from "./wizard/WizardUI"
import { Step1General } from "./wizard/Step1General"
import { Step2Terms } from "./wizard/Step2Terms"
import { Step3Engine } from "./wizard/Step3Engine"
import { Step4Accounting } from "./wizard/Step4Accounting"
import { useRouter } from "next/navigation"

import { updateLoanProductWizard } from "@/app/actions/loan-product"

interface LoanProductWizardProps {
    accounts: any[]
    initialData?: Partial<LoanProductWizardValues>
    productId?: string
}

const steps = ["General Identity", "Terms & Limits", "Engine Configuration", "Accounting Mapping"]

export function LoanProductWizard({ accounts, initialData, productId }: LoanProductWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const isEditMode = !!productId

    const methods = useForm<LoanProductWizardValues>({
        resolver: zodResolver(loanProductWizardSchema) as any,
        mode: "onChange",
        defaultValues: {
            currency: "KES",
            repaymentFrequencyType: "MONTHLY",
            interestType: "DECLINING_BALANCE",
            amortizationType: "EQUAL_INSTALLMENTS",
            interestCalculationPeriodType: "SAME_AS_REPAYMENT",
            minPrincipal: 0,
            maxPrincipal: 1000000,
            minRepaymentTerms: 1,
            maxRepaymentTerms: 12,
            defaultPenaltyRate: 0,
            gracePeriod: 0,
            ...initialData // Merge initial data if present
        }
    })

    const { handleSubmit, trigger, formState: { isValid } } = methods

    const handleNext = async () => {
        let stepIsValid = false;

        // Trigger validation for current step fields only
        if (currentStep === 1) {
            stepIsValid = await trigger(["name", "shortCode", "currency", "description"]);
        } else if (currentStep === 2) {
            stepIsValid = await trigger(["principal", "minPrincipal", "maxPrincipal", "numberOfRepayments", "minRepaymentTerms", "maxRepaymentTerms", "repaymentEvery", "repaymentFrequencyType"]);
        } else if (currentStep === 3) {
            stepIsValid = await trigger(["interestRatePerPeriod", "interestType", "amortizationType", "interestCalculationPeriodType", "defaultPenaltyRate", "gracePeriod"]);
        } else if (currentStep === 4) {
            stepIsValid = await trigger(["fundSourceAccountId", "loanPortfolioAccountId", "interestRevenueAccountId", "interestReceivableAccountId", "penaltyRevenueAccountId", "penaltyReceivableAccountId"]);
        }

        if (stepIsValid) {
            if (currentStep < 4) {
                setCurrentStep(s => s + 1)
            } else {
                await onSubmit();
            }
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(s => s - 1)
        }
    }

    const onSubmit = handleSubmit(async (data: LoanProductWizardValues) => {
        setIsSubmitting(true)
        try {
            let result;
            if (isEditMode && productId) {
                result = await updateLoanProductWizard(productId, data);
            } else {
                result = await createLoanProductWizard(data);
            }

            if (result.success) {
                router.push('/admin/system') // Redirect to system admin to view list
                router.refresh() // Ensure cache is invalidated
            }
        } catch (error: any) {
            alert("Error: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    })

    return (
        <FormProvider {...methods}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {}
                <div className="md:col-span-1">
                    <div className="sticky top-6">
                        <StepIndicator currentStep={currentStep} steps={steps} />
                        {isEditMode && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Editing Mode</p>
                                <p className="text-xs text-amber-600 mt-1">Changes apply only to future loans.</p>
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="md:col-span-3 space-y-8">
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                        {currentStep === 1 && <Step1General />}
                        {currentStep === 2 && <Step2Terms />}
                        {currentStep === 3 && <Step3Engine />}
                        {currentStep === 4 && <Step4Accounting accounts={accounts} />}

                        {}
                        <div className="flex justify-between pt-6 border-t border-slate-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1 || isSubmitting}
                            >
                                Back
                            </Button>

                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className={currentStep === 4 ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                            >
                                {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : currentStep === 4 ? (isEditMode ? "Update Product" : "Create Product") : "Next Step"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </FormProvider>
    )
}
