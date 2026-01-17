/**
 * Organization Configuration
 * 
 * Centralized storage for organization/SACCO details
 * used in documents, receipts, and schedules.
 */

export const organizationConfig = {
    name: 'CAPITAL CREW SACCO',

    // Contact Details
    poBox: 'P.O. BOX 886 KIAMBU',
    phone: 'Phone No:0111033100',
    email: 'info@capitalcrew.co.ke',

    // Physical Address
    address: {
        street: '',
        city: 'Kiambu',
        country: 'Kenya'
    },

    // Registration
    registration: {
        number: '',
        date: ''
    },

    // Branding
    logo: '/images/logo.png',

    // Financial Year
    financialYear: {
        start: '01-01',
        end: '12-31'
    }
}

export type OrganizationConfig = typeof organizationConfig
