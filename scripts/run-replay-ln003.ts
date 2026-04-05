
import { TransactionReplayService } from '../lib/services/TransactionReplayService';
import { db } from '../lib/db';

async function runReplay() {
    const loanId = 'cmnf0fp7i0003tmxcnzlhukxx';
    console.log(`Running Transaction Replay for LN003 (${loanId})...`);

    const result = await TransactionReplayService.replayTransactions(loanId);
    console.log('Replay Result:', JSON.stringify(result, null, 2));
}

runReplay()
    .catch(console.error)
    .finally(() => db.$disconnect());
