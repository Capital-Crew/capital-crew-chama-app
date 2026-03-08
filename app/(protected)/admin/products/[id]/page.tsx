import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
// import { PrismaClient } from "@prisma/client"
import { protectPage } from "@/lib/with-module-protection"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from "next/link"
import { Edit, ArrowLeft } from "lucide-react"
import { ProductAccountingForm } from "@/components/products/ProductAccountingForm"

import { db as prisma } from "@/lib/db"

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) return redirect("/auth/login")
    if (!await protectPage('ADMIN')) return redirect('/dashboard')

    const { id } = await params
    const product = await prisma.loanProduct.findUnique({
        where: { id },
        include: {
            // we can include mappings if we want to show count in badge, but form fetches its own
        }
    })

    if (!product) return notFound()

    return (
        <div className="max-w-6xl mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/admin/products" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <Badge variant="outline" className="text-muted-foreground">Product Details</Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{product.name} ({product.shortCode})</h1>
                    <p className="text-muted-foreground">{product.description || "No description provided."}</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/admin/products/${id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Configuration
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="accounting">Accounting</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Core Configuration</CardTitle>
                            <CardDescription>Basic settings and terms for this loan product.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Interest Rate</span>
                                <p className="text-lg font-semibold">{product.interestRatePerPeriod.toString()}% / {product.repaymentFrequencyType}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Repayment Frequency</span>
                                <p className="text-lg font-semibold">Every {product.repaymentEvery} {product.repaymentFrequencyType}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Principal Range</span>
                                <p className="text-lg font-semibold">
                                    {product.currency} {Number(product.minPrincipal).toLocaleString()} - {Number(product.maxPrincipal).toLocaleString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Term Range</span>
                                <p className="text-lg font-semibold">{product.minRepaymentTerms} - {product.maxRepaymentTerms} Installments</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Amortization</span>
                                <p className="text-lg font-semibold capitalize">{product.amortizationType.replace('_', ' ').toLowerCase()}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                <p>
                                    <Badge className={product.isActive ? "bg-green-500" : "bg-gray-500"}>
                                        {product.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="accounting">
                    <ProductAccountingForm productId={id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
