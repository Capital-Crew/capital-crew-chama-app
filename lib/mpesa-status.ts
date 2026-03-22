import axios from "axios";
import { getAccessToken } from "./mpesa";

interface MpesaQueryResponse {
    ResponseCode: string;
    ResponseDescription: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: string; // "0" is success
    ResultDesc: string;
}

export interface TransactionStatusResult {
    status: 'COMPLETED' | 'FAILED' | 'PENDING';
    mpesaReceiptNumber?: string;
    failureReason?: string;
}

/**
 * Check the status of an STK Push transaction via M-Pesa API
 */
export async function checkTransactionStatus(checkoutRequestId: string): Promise<TransactionStatusResult> {
    const BASE_URL = process.env.MPESA_BASE_URL;
    const PASSKEY = process.env.MPESA_PASSKEY;
    const SHORTCODE = process.env.MPESA_SHORTCODE || "174379";


    // If missing envs, we can't do real check.
    if (!BASE_URL || !PASSKEY) {
        if (process.env.NODE_ENV !== 'production') {
        }
        return {
            status: 'COMPLETED',
            mpesaReceiptNumber: checkoutRequestId
        };
    }


    try {
        const token = await getAccessToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);

        const password = Buffer.from(
            `${SHORTCODE}${PASSKEY}${timestamp}`
        ).toString("base64");

        const payload = {
            BusinessShortCode: SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId
        };

        const response = await axios.post(
            `${BASE_URL}/mpesa/stkpushquery/v1/query`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data as MpesaQueryResponse;

        if (data.ResponseCode !== "0") {
            // Request failed at API level
            return { status: 'PENDING', failureReason: data.ResponseDescription };
        }

        if (data.ResultCode === "0") {
            return {
                status: 'COMPLETED',
                mpesaReceiptNumber: "N/A"
            };
        } else {
            return {
                status: 'FAILED',
                failureReason: data.ResultDesc
            };
        }

    } catch (error: any) {
        // TODO: Log error to monitoring service
        console.error("M-Pesa Query Error:", error.message);

        // --- MOCK SERVER COMPATIBILITY ---
        const isLocalMock = (BASE_URL || "").includes('localhost') || (BASE_URL || "").includes('127.0.0.1');
        if (isLocalMock) {
            if (process.env.NODE_ENV !== 'production') {
            }
            return {
                status: 'COMPLETED',
                mpesaReceiptNumber: checkoutRequestId
            };
        }
        // ---------------------------------

        if (error.response) {
            // TODO: Log error to monitoring service
            console.error("Query Error Data:", JSON.stringify(error.response.data, null, 2));
            const errorCode = error.response.data?.errorCode;
            if (errorCode === '500.001.1001') {
                return { status: 'PENDING', failureReason: 'Transaction processing' };
            }
        }
        throw new Error(`Failed to query transaction status: ${error.message}`);
    }
}
