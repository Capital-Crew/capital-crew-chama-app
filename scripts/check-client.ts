import { SystemAccountType } from '@prisma/client'

console.log('SystemAccountType keys:', Object.keys(SystemAccountType))
console.log('INCOME_REFINANCE_FEE exists:', 'INCOME_REFINANCE_FEE' in SystemAccountType)
