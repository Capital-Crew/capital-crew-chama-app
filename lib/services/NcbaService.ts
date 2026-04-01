import axios from "axios";

/**
 * NCBA Payment API Service
 * Handles authentication and STK Push initiation.
 */
export class NcbaService {
    private static readonly AUTH_URL = process.env.NCBA_AUTH_URL;
    private static readonly API_BASE_URL = process.env.NCBA_API_BASE_URL;
    private static readonly CLIENT_ID = process.env.NCBA_CLIENT_ID;
    private static readonly CLIENT_SECRET = process.env.NCBA_CLIENT_SECRET;
    private static readonly CALLBACK_URL = process.env.NCBA_CALLBACK_URL;

    /**
     * Obtains an OAuth2 access token from NCBA using client credentials flow.
     */
    private static async getAccessToken(): Promise<string> {
        if (!this.AUTH_URL || !this.CLIENT_ID || !this.CLIENT_SECRET) {
            throw new Error("Missing NCBA API credentials in environment variables.");
        }

        const credentials = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString("base64");

        try {
            const response = await axios.post(
                this.AUTH_URL,
                "grant_type=client_credentials",
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            return response.data.access_token;
        } catch (error: any) {
            console.error("NCBA Auth Error:", error.response?.data || error.message);
            throw new Error(`Failed to authenticate with NCBA API: ${error.message}`);
        }
    }

    /**
     * Initiates an STK Push (M-Pesa payment) via NCBA's Payment API.
     * 
     * @param phoneNumber Normalized MSISDN (2547XXXXXXXX)
     * @param amount Transaction amount
     * @param reference Unique reference ID (matched in callback)
     * @returns NCBA API response
     */
    public static async initiateStkPush(phoneNumber: string, amount: number, reference: string) {
        if (!this.API_BASE_URL || !this.CALLBACK_URL) {
            throw new Error("Missing NCBA API base URL or callback URL.");
        }

        const token = await this.getAccessToken();

        const payload = {
            phoneNumber,
            amount: Math.floor(amount), // Ensure integer if required by API
            reference,
            description: `Capital Crew Deposit - ${reference}`,
            callbackUrl: this.CALLBACK_URL,
            // Additional NCBA specific fields would go here
        };

        try {
            const response = await axios.post(
                `${this.API_BASE_URL}/stkpush`, // Endpoint path may vary
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                success: true,
                ncbaReference: response.data.ncbaReference || response.data.transactionReference,
                response: response.data
            };
        } catch (error: any) {
            console.error("NCBA STK Push Error:", error.response?.data || error.message);
            throw new Error(`NCBA STK Push Initiation Failed: ${error.message}`);
        }
    }
}
