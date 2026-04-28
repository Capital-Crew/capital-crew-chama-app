import crypto from 'crypto';

/**
 * Sends a securely signed HTTP request to the internal M-Pesa Gateway.
 * 
 * @param path - The API path (e.g., '/payments/deposit')
 * @param payload - The JSON payload to send
 * @param idempotencyKey - A unique UUID v4 to prevent duplicate submissions
 */
export async function sendToGateway(path: string, payload: any, idempotencyKey: string) {
  const timestamp = Date.now().toString();
  const bodyString = JSON.stringify(payload);
  
  // Canonical string matches the gateway's expectation
  const canonicalString = `POST:/api/v1${path}:${timestamp}:${bodyString}`;
  
  const secret = process.env.GATEWAY_HMAC_SECRET;
  if (!secret) {
    throw new Error('GATEWAY_HMAC_SECRET is not configured in the environment.');
  }

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(canonicalString)
    .digest('hex');

  const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3001';

  const response = await fetch(`${gatewayUrl}/api/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
      'x-timestamp': timestamp,
      'x-idempotency-key': idempotencyKey,
      'x-client-id': 'nextjs-core'
    },
    body: bodyString
  });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Gateway Error ${response.status}: ${JSON.stringify(errorBody)}`);
  }

  return response.json();
}
