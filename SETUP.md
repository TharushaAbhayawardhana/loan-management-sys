# FFMS — Family Financial Management System

## Prerequisites

- Node.js 18+
- A Firebase project (already created: `ffms-93aba`)
- Firebase CLI (`npm install -g firebase-tools`)

## Local Setup

1. **Clone and install dependencies**

```bash
npm install
```

2. **Configure environment variables**

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

The provided values are already in `.env.local`. **Do not commit `.env.local`** — it is git-ignored.

3. **Run the dev server**

```bash
npm run dev
```

4. **Build for production**

```bash
npm run build
```

## Firebase Configuration

### Deploy Firestore Security Rules

The security rules file is at `firestore.rules`. Deploy it with:

```bash
npx firebase deploy --only firestore:rules
```

### Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/project/ffms-93aba/authentication)
2. Enable **Email/Password** sign-in
3. Enable **Google** sign-in (optional but recommended)

### Firestore Security Model

Rules enforce:
- All access requires authentication
- Data is scoped to households: `households/{householdId}/loans/*`, etc.
- Users can only read/write their own household's data (membership in `household.members` array)
- Document shape validation on write for loans, payments, and cash transactions

## Deployment

```bash
npm run build
npx firebase deploy --only hosting
```

## Local Data Migration

The app stores local IndexedDB data from the previous Dexie-based version. On first sign-in, a **"Import Local Data"** panel appears on the Reports page — click it to migrate your existing loans, payments, and cash transactions to your Firestore household. Your local data is cleared after a successful import.

## Architecture

- **Auth**: Firebase Authentication (Email/Password + Google)
- **Database**: Firestore (real-time via `onSnapshot`)
- **Offline**: Firestore persistent cache (enabled on init)
- **State**: React Context for auth, real-time hooks for data
- **UI**: React 18 + TypeScript + Tailwind CSS v4 + Recharts
- **Build**: Vite 8

## ⚠️ Security Note: Firebase API Key

The Firebase API key in `.env.local` was provisionally exposed by being pasted into this chat. While Firebase web API keys are meant to be public (security comes from Firestore Rules + App Check), **you should regenerate the key** if this project will be public:

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Find the API key for `ffms-93aba`
3. Click **RESTRICT KEY**
4. Add **HTTP referrers** (your domains) to prevent unauthorized usage
