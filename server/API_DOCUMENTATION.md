# Photify Express Server API Documentation

## Overview

Express server for Photify with Supabase, Stripe, and OpenAI integrations.

## New API Endpoints

### 1. Checkout API

**Endpoint:** `POST /api/checkout`

Creates a Stripe checkout session and order in Supabase.

**Request Body:**

```json
{
  "cartItems": [
    {
      "name": "Canvas Print",
      "size": "24x36 inches",
      "image": "https://...",
      "price": 89.99,
      "quantity": 1
    }
  ],
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "shippingAddress": {
    "address": "123 Main St, City, State",
    "postcode": "12345"
  },
  "videoPermission": false,
  "subtotal": 89.99,
  "deliveryFee": 10.0,
  "total": 99.99
}
```

**Response:**

```json
{
  "sessionId": "cs_test_...",
  "orderId": "uuid",
  "orderNumber": "ORD-001234",
  "url": "https://checkout.stripe.com/..."
}
```

### 2. Stripe Webhook

**Endpoint:** `POST /api/webhook`

Handles Stripe webhook events (payment success/failure).

**Headers:**

- `stripe-signature`: Webhook signature from Stripe

**Events Handled:**

- `checkout.session.completed` - Updates order to paid
- `payment_intent.succeeded` - Logs successful payment
- `payment_intent.payment_failed` - Updates order to failed

### 3. Semantic Search

**Endpoint:** `GET /api/search/semantic`

Performs AI-powered semantic search on products.

**Query Parameters:**

- `q` (required): Search query
- `limit` (optional): Number of results (default: 8)
- `threshold` (optional): Similarity threshold (default: 0.7)

**Example:**

```
GET /api/search/semantic?q=modern%20abstract%20art&limit=10&threshold=0.7
```

**Response:**

```json
{
  "success": true,
  "query": "modern abstract art",
  "results": [
    {
      "id": "uuid",
      "name": "Abstract Canvas Print",
      "slug": "abstract-canvas-print",
      "description": "Modern abstract artwork",
      "images": ["https://..."],
      "price": 79.99,
      "is_featured": true,
      "category_name": "Abstract Art",
      "similarity": 0.8543
    }
  ],
  "count": 10,
  "threshold": 0.7
}
```

**POST Alternative:**
**Endpoint:** `POST /api/search/semantic`

```json
{
  "query": "modern abstract art",
  "limit": 10,
  "threshold": 0.7,
  "filters": {
    "category": "Abstract Art",
    "minPrice": 50,
    "maxPrice": 200,
    "featured": true
  }
}
```

### 4. Generate Embeddings

**Endpoint:** `POST /api/embeddings/generate`

Generates AI embeddings for products (for semantic search).

**Single Product:**

```json
{
  "productId": "uuid"
}
```

**Multiple Products:**

```json
{
  "productIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Bulk Update All:**

```json
{
  "bulkUpdate": true
}
```

**Response:**

```json
{
  "success": true,
  "productId": "uuid",
  "searchText": "Canvas Print Abstract Art",
  "embeddingDimensions": 1536
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd Photify/server
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (not anon key!)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `OPENAI_API_KEY` - OpenAI API key

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
npm start
```

## Important Notes

### Webhook Configuration

The webhook endpoint requires **raw body** parsing. The route is already configured with `express.raw()` middleware.

To set up Stripe webhooks:

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-server.com/api/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook signing secret to `.env`

### Supabase Service Key

⚠️ **Important:** Use the **service role key**, not the anon key. The service role key bypasses RLS policies and is needed for server-side operations.

### OpenAI Rate Limits

The embeddings generation includes a 50ms delay between requests to avoid rate limiting.

## Integration with Frontend

Update your frontend environment variables:

```env
VITE_API_URL=http://localhost:5000/api
```

Example API calls from frontend:

```typescript
// Checkout
const response = await fetch(`${import.meta.env.VITE_API_URL}/checkout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(checkoutData),
});

// Search
const results = await fetch(
  `${import.meta.env.VITE_API_URL}/search/semantic?q=${query}`
);
```

## Testing

### Test Checkout Endpoint

```bash
curl -X POST http://localhost:5000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "cartItems": [{"name": "Test", "price": 10, "quantity": 1}],
    "customerInfo": {"name": "Test", "email": "test@test.com", "phone": "123"},
    "shippingAddress": {"address": "123 Test", "postcode": "12345"},
    "subtotal": 10,
    "deliveryFee": 5,
    "total": 15
  }'
```

### Test Semantic Search

```bash
curl "http://localhost:5000/api/search/semantic?q=abstract%20art&limit=5"
```

## Migration from Next.js

All Next.js API routes have been successfully converted to Express:

- ✅ `/app/api/checkout/route.ts` → `/api/checkout`
- ✅ `/app/api/webhook/route.ts` → `/api/webhook`
- ✅ `/app/api/search/semantic/route.ts` → `/api/search/semantic`
- ✅ `/app/api/embeddings/generate/route.ts` → `/api/embeddings/generate`

The logic is identical, just adapted for Express patterns.
