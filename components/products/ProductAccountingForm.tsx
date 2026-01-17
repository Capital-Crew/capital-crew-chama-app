'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { Loader2 } from 'lucide-react'
import { getAllAccounts } from '@/app/actions/system-accounting'
import { getProductMappings, updateProductMapping } from '@/app/actions/product-accounting'
import { ProductAccountingType } from '@prisma/client'

type Props = {
    productId: string
}

type AccountOption = {
    id: string
    code: string
    name: string
}

type Mapping = {
    productId: string
    accountType: ProductAccountingType
    accountId: string
}

export function ProductAccountingForm({ productId }: Props) {
    const [accounts, setAccounts] = useState<AccountOption[]>([])
    const [mappings, setMappings] = useState<Mapping[]>([])
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    const fetchData = async () => {
        setLoading(true)
        try {
            const [accs, maps] = await Promise.all([
                getAllAccounts(),
                getProductMappings(productId)
            ])
            setAccounts(accs)
            setMappings(maps)
        } catch (error) {
            toast.error("Failed to load accounting data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [productId])

    const handleMappingChange = (type: ProductAccountingType, accountId: string) => {
        startTransition(async () => {
            try {
                const result = await updateProductMapping(productId, type, accountId)
                if (result.success) {
                    toast.success("Mapping updated")
                    fetchData()
                } else {
                    toast.error("Failed to update mapping")
                }
            } catch (error) {
                toast.error("Update failed")
            }
        })
    }

    const formatType = (type: string) => {
        return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    }

    const requiredTypes = Object.keys(ProductAccountingType) as ProductAccountingType[]

    const mergedList = requiredTypes.map(type => {
        const existing = mappings.find(m => m.accountType === type)
        return {
            type,
            mapping: existing
        }
    })

    if (loading) {
        return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Product Ledger Configuration</CardTitle>
                <CardDescription>
                    Associate this loan product with specific General Ledger accounts.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Accounting Role</TableHead>
                            <TableHead>Mapped GL Account</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mergedList.map(({ type, mapping }) => (
                            <TableRow key={type}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{formatType(type)}</span>
                                        <span className="text-xs text-muted-foreground">{type}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Select
                                        disabled={isPending}
                                        value={mapping?.accountId || ""}
                                        onValueChange={(val) => handleMappingChange(type, val)}
                                    >
                                        <SelectTrigger className="w-full max-w-md">
                                            <SelectValue placeholder="Select GL Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((acc) => (
                                                <SelectItem key={acc.id} value={acc.id}>
                                                    {acc.code} - {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    {mapping ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            Mapped
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                            Pending
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
