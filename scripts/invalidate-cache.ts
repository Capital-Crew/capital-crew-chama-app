
import { revalidateTag } from 'next/cache';

async function main() {
    console.log('🔄 Invalidating RBAC cache...');
    revalidateTag('rbac');
    console.log('✅ Cache invalidated.');
}

main().catch(console.error);
