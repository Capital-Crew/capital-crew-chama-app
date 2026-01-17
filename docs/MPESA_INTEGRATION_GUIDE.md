# M-Pesa Integration Guide (Daraja API)

This guide covers how to link your **M-Pesa Till Number (Buy Goods)** or **Paybill** to the system.

## 1. Prerequisites (Daraja Portal)
1.  Log in to [Safaricom Daraja Portal](https://developer.safaricom.co.ke/).
2.  **Create a New App**:
    *   Go to **My Apps** -> **Create New App**.
    *   Select **Lipa na M-Pesa Sandbox** (for testing) and **M-Pesa Sandbox**.
    *   Note down the **Consumer Key** and **Consumer Secret**.
3.  **Test Credentials (Sandbox)**:
    *   Go to **APIs** -> **MPesa Express** -> **Simulate**.
    *   Note the **Business Shortcode** (e.g., `174379`) and **Passkey**.

## 2. Configuration (.env)
Update your `.env` file with the keys.

### For Paybill
```env
# Credentials from Daraja App
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret

# Shortcodes
MPESA_SHORTCODE=174379       # Your Paybill Number
MPESA_PASSKEY=bfb279f9aa9bdb... # From Daraja

# Type
MPESA_TYPE=PAYBILL
```

### For Till Number (Buy Goods)
**Important**: For Till Numbers, the "PartyB" (Receiver) is the Store Number, which is often the same as the Till Number in Sandbox.

```env
# Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret

# Shortcodes
MPESA_SHORTCODE=600xxx       # Your Store Number / Till Number
MPESA_C2B_SHORTCODE=600xxx   # Same as above (for C2B Registration)
MPESA_PASSKEY=bfb279f9aa9bdb...

# Type Configuration
MPESA_TYPE=TILL              # Switches STK Push to 'CustomerBuyGoodsOnline'
```

## 3. Registering Callback URLs (C2B)
For manual payments (where a customer types your Paybill/Till on their phone), you **MUST** register your validation and confirmation URLs with Safaricom.

We have added a helper method `MpesaService.registerC2BUrl()` to do this.

**How to run it:**
1.  Create a temporary script or route to trigger this method. 
2.  Or temporarily call it from `app/page.tsx` (Homepage) once to register.

```typescript
// Example: Create a route at app/api/mpesa/register/route.ts
import { NextResponse } from 'next/server'
import { MpesaService } from '@/lib/services/MpesaService'

export async function GET() {
    try {
        const result = await MpesaService.registerC2BUrl()
        return NextResponse.json(result)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
```
3.  Visit `http://localhost:3000/api/mpesa/register` (Note: You **MUST** be using a public URL like Ngrok for Safaricom to reach you. Localhost won't work for the actual registration callback URL payload).

**Using Ngrok (Required for Local Dev):**
1.  Install Ngrok.
2.  Run `ngrok http 3000`.
3.  Update `NEXT_PUBLIC_APP_URL` in `.env` to your `https://xxxx.ngrok-free.app`.
4.  Run the registration script.

## 4. Testing
### STK Push (M-Pesa Express)
1.  Go to **Wallet** -> **Deposits** -> **M-Pesa**.
2.  Enter your test phone number.
3.  Click **Send Request**.
4.  If configured correctly, your phone should trigger a PIN prompt.

### Manual Payment (C2B)
1.  Open M-Pesa Toolkit on your phone (or Daraja Simulator).
2.  Use **Paybill** or **Buy Goods**.
3.  Enter the configured Shortcode.
4.  **Important**:
    *   **Paybill**: Enter `Account Number` matching a Wallet Ref (e.g., Member Number).
    *   **Till Number**: No Account Number field. The system will attempt to match your **Phone Number** to a `Member` account automatically.

## 5. Going Live
1.  **Go Live on Daraja**: Submit your app for approval.
2.  **Production Keys**: Replace Sandbox keys with Production keys.
3.  **Certificates**: Ideally, use a production certificate, though for standard integrations the Passkey mechanism often persists or shifts to a simplified one depending on the specific Safaricom product.
4.  **URLs**: Update `NEXT_PUBLIC_APP_URL` to your live domain and **re-register** the C2B URLs using the script from Step 3.
