
import { triggerInterestEngine } from './app/engine-health-actions';

async function testAction() {
    console.log('Triggering Interest Engine Action...');
    try {
        const result = await triggerInterestEngine();
        console.log('Action Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error triggering action:', error);
    } finally {
        process.exit();
    }
}

testAction();
