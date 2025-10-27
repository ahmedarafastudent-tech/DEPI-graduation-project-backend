## Payments

### Create Payment Session

POST /api/payments/create-payment
Protected: Yes

Request:
```json
{
  "orderId": "order_id"
}
```

Response (200 OK):
```json
{
  "success": true,
  "payment_url": "https://secure.paytabs.com/...",
  "tran_ref": "transaction_reference"
}
```

### Verify Payment Status

GET /api/payments/verify/:orderId
Protected: Yes

Response (200 OK):
```json
{
  "success": true,
  "payment_status": "A", // A: Approved, D: Declined, V: Voided, etc.
  "transaction_details": {
    // Detailed transaction information
  }
}
```

### Webhook Handler

POST /api/payments/webhook
Protected: No (PayTabs server-to-server callback)

This endpoint is used by PayTabs to send payment status updates. It should not be called directly.