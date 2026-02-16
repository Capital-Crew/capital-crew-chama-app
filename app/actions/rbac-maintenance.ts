
'use server'

import { revalidateTag } from 'next/cache'

export async function clearRbacCache() {
    revalidateTag('rbac')
    console.log('Cleared RBAC cache')
    return { success: true }
}
