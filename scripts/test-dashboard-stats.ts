import { getDashboardStats } from '../app/dashboard-actions'

async function test() {
  try {
    const stats = await getDashboardStats()
    console.log('--- DASHBOARD STATS ---')
    console.log('Total Contributions:', stats.totalContributions)
    console.log('Outstanding Loans:', stats.outstandingLoans)
    console.log('Delinquent Loans Count:', stats.delinquentLoans?.length)
    console.log('---')
  } catch (e) {
    console.error('Error fetching stats:', e)
  }
}

test().catch(console.error)
