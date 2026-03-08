import { getApps, cert, initializeApp, App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

function buildCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  return cert({
    projectId,
    clientEmail,
    privateKey
  })
}

function initFirebaseAdmin(): App {
  if (getApps().length) {
    return getApps()[0]!
  }

  const credential = buildCredential()

  if (!credential) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY."
    )
  }

  return initializeApp({ credential })
}

const adminApp = initFirebaseAdmin()

export const adminAuth = getAuth(adminApp)
