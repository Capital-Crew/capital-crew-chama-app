
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}


const prismaClient = (globalThis as any).prisma ?? prismaClientSingleton()
if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prismaClient

export default prismaClient
