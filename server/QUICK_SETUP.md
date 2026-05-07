# Quick Setup Guide

## Get the Express API Running in 5 Minutes

### Step 1: Install Dependencies

```bash
cd Photify/server
npm install
```

### Step 2: Create Environment File

```bash
cp .env.example .env
```

### Step 3: Add Your Credentials to `.env`

**Supabase** (from your Supabase Dashboard):

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Use Service Role Key, not anon!
```

**Stripe** (from Stripe Dashboard):

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # After creating webhook
```

**Basic Config:**

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Step 4: Start the Server

```bash
npm run dev
```

You should see:

```
🚀 Server running on port 5000 in development mode
```

### Step 5: Test It Works

Open browser or use curl:

```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/api
```

---

## 🎯 Quick Test Endpoints

### 1. Health Check (No auth needed)

```bash
curl http://localhost:5000/health
```

Expected: `{"status": "OK", ...}`

### 2. API Info (No auth needed)

```bash
curl http://localhost:5000/api
```

Expected: List of endpoints

---

## 🔧 Troubleshooting

### Server won't start?

1. Check Node version: `node -v` (need 18+)
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check for port conflicts: `lsof -i :5000`

### Environment variables not loading?

1. Make sure file is named `.env` (not `.env.txt`)
2. No spaces around `=` in .env file
3. Restart server after changing .env

### TypeScript errors?

```bash
npm run build
```

Fix any errors shown, then restart server.

---

## 📋 Credentials Checklist

Before running, make sure you have:

- [ ] Supabase project URL
- [ ] Supabase service role key (NOT anon key)
- [ ] Stripe secret key (test or live)

---

## 🚀 Production Build

When ready for production:

```bash
# Build
npm run build

# Start production server
npm start
```

---

## 📚 Need More Help?

- See `API_DOCUMENTATION.md` for detailed endpoint docs
- See `MIGRATION_SUMMARY.md` for complete migration details
- Check `README.md` for project overview

---

**That's it!** Your Express server is now running with all the API routes from Photify-Original. 🎉
