This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Order Email Notifications (Gmail SMTP + Next.js)

This project now sends automatic email notifications for order lifecycle events:

- User gets confirmation mail when order is created
- Selected supplier gets mail for specific launch
- All active + approved suppliers get mail for global launch
- User gets mail when supplier accepts order
- User gets mail when order becomes `awaiting_payment` (pay now)
- User gets mail when status changes (`printing`, `printed`, `delivered`)
- User and supplier get cancellation mail
- User and supplier get payment success mail

Implementation lives in:

- `lib/order-email.ts`
- `app/api/upload/route.ts`
- `app/api/orders/accept/route.ts`
- `app/api/orders/verify/route.ts`
- `app/api/orders/update-status/route.ts`
- `app/api/orders/cancel/route.ts`
- `app/api/orders/supplier-cancel/route.ts`
- `app/api/payment/verify/route.ts`
- `app/api/payment/webhook/route.ts`

### Step-by-step setup (works on Vercel and Render)

1. Enable 2-Step Verification on `printmypagepsit@gmail.com`.
2. Create Google App Password for Mail.
3. Add these env vars in local, Vercel, and Render:

```bash
GMAIL_USER=printmypagepsit@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
EMAIL_FROM=PrintMyPage <printmypagepsit@gmail.com>
EMAIL_REPLY_TO=printmypagepsit@gmail.com
```

4. Local setup:
- Add vars to `.env.local`.
- Restart dev server after changes.

5. Vercel setup:
- Open project in Vercel dashboard.
- Go to `Project Settings -> Environment Variables`.
- Add all 4 env vars for Production (and Preview if needed).
- Redeploy.

6. Render setup:
- Open your Render service.
- Go to `Environment`.
- Add all 4 env vars.
- Deploy the service again.

7. Verify supplier emails exist
- Supplier notifications are resolved using `User.email` via supplier `firebaseUID`.
- Ensure each supplier user profile has a valid `email`.

8. Production test flow
- Create a specific order -> check user + selected supplier email.
- Create a global order -> check active suppliers get email.
- Accept/verify order -> check user receives acceptance/payment email.
- Complete payment -> check user + supplier payment email.
- Move status to `printing/printed/delivered` -> check user status emails.

9. Troubleshooting
- If mail not sent, check server logs for:
  - `EMAIL_NOT_CONFIGURED`
  - `EMAIL_SEND_ERROR`
- Confirm recipients exist and have valid emails in DB.
