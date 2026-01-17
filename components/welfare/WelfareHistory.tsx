'use client'

import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type Requisition = any // Define type

interface WelfareHistoryProps {
    requisitions: Requisition[]
}

export function WelfareHistory({ requisitions }: WelfareHistoryProps) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default' // or success/green if available
            case 'DISBURSED': return 'default' // green
            case 'REJECTED': return 'destructive'
            case 'PENDING': return 'secondary' // or yellow
            case 'CANCELLED': return 'outline'
            default: return 'secondary'
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Requisition History</CardTitle>
                <CardDescription>View status of your welfare applications</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ref No.</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requisitions.map((req: any) => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.requisitionNumber}</TableCell>
                                <TableCell>{req.welfareType.name}</TableCell>
                                <TableCell>{format(new Date(req.createdAt), 'dd MMM yyyy')}</TableCell>
                                <TableCell>KES {Number(req.amount).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(req.status)}>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {requisitions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No history found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
