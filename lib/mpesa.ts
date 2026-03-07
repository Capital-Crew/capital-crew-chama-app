import axios from "axios";

const BASE_URL = process.env.MPESA_BASE_URL;
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

// Generate OAuth Access Token
export async function getAccessToken() {
    // Access env vars dynamically to ensure fresh values
    const BASE_URL = process.env.MPESA_BASE_URL;
    const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
    const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;

    if (!BASE_URL || !CONSUMER_KEY || !CONSUMER_SECRET) {
        throw new Error("Missing M-Pesa environment variables");
    }

    const credentials = Buffer.from(
        `${CONSUMER_KEY}:${CONSUMER_SECRET}`
    ).toString("base64");

    try {
        const response = await axios.get(
            `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                },
            }
        );
        return response.data.access_token;
    } catch (error: any) {
        // Throw detailed error
        const details = error.code ? `(${error.code} at ${BASE_URL})` : error.response ? `(Status: ${error.response.status})` : '';
        throw new Error(`Failed to get M-Pesa access token: ${error.message} ${details}`);
    }
}

// Initiate STK Push
export async function initiateSTKPush(phoneNumber: string, amount: number) {
    const BASE_URL = process.env.MPESA_BASE_URL;
    const PASSKEY = process.env.MPESA_PASSKEY;
    const CALLBACK_URL = process.env.MPESA_CALLBACK_URL; // e.g. http://localhost:3000/api/mpesa/callback
    const SHORTCODE = process.env.MPESA_SHORTCODE || "174379"; // Use env or default

    if (!BASE_URL || !PASSKEY || !CALLBACK_URL) {
        throw new Error("Missing M-Pesa environment variables");
    }

    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);

    const password = Buffer.from(
        `${SHORTCODE}${PASSKEY}${timestamp}`
    ).toString("base64");

    // Format phone number to 254...
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
        formattedPhone = '254' + formattedPhone;
    }

    const payload = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline", // valid for PayBill, use CustomerBuyGoodsOnline for Till
        Amount: Math.floor(amount).toString(), // API expects a string
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: "CapitalCrew",
        TransactionDesc: "Deposit",
    };


    try {
        const response = await axios.post(
            `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`STK Push Failed: ${JSON.stringify(error.response.data)}`);
        }
        throw new Error(`Failed to initiate STK Push: ${error.message}`);
    }
}

export const MpesaService = {
    initiateSTKPush,
};
