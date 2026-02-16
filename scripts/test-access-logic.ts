
import { checkPermission } from '../lib/rbac-service';
import { UserRole } from '@prisma/client';

async function testAccessLogic() {
    console.log('🧪 Testing RBAC Service Logic (checkPermission)...');

    const roles: UserRole[] = ['MEMBER', 'CHAIRPERSON', 'TREASURER', 'SECRETARY'];
    const modulesToCheck = ['DASHBOARD', 'LOANS', 'ADMIN', 'AUDIT'];

    for (const role of roles) {
        console.log(`\n👤 Testing Role: ${role}`);
        for (const moduleKey of modulesToCheck) {
            try {
                const hasAccess = await checkPermission(role, moduleKey);
                const status = hasAccess ? '✅ ALLOWED' : '❌ DENIED';
                console.log(`   - Access to ${moduleKey.padEnd(10)}: ${status}`);
            } catch (error) {
                console.error(`   - Error checking ${moduleKey}:`, error);
            }
        }
    }
}

testAccessLogic()
    .catch(console.error)
    .finally(() => process.exit(0)); // checkPermission uses db, which might hang if not disconnected, but script exit works
