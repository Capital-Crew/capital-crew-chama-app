
import prisma from "@/lib/prisma"
import { SettingsModule } from "@/components/SettingsModule"

export default async function SettingsPage() {
    const [products, chargeTemplates] = await Promise.all([
        prisma.loanProduct.findMany({ where: { isActive: true } }),
        prisma.chargeTemplate.findMany({ where: { isActive: true } })
    ])

    return <SettingsModule products={products as any} chargeTemplates={chargeTemplates} />
}
