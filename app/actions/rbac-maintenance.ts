
'use server'

import { revalidateTag } from 'next/cache'

export async function clearRbacCache() {
    revalidateTag('rbac')
    return { success: true }
}
