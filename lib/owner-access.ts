const FALLBACK_OWNER_EMAILS =
  process.env.NODE_ENV === "production"
    ? []
    : ["abhinav1the2great3@gmail.com"]

function parseEmailList(value: string) {
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getOwnerEmails() {
  const configured =
    process.env.NEXT_PUBLIC_ADMIN_OWNER_EMAILS ||
    process.env.ADMIN_OWNER_EMAILS ||
    ""

  const combined = [...parseEmailList(configured), ...FALLBACK_OWNER_EMAILS]
  return Array.from(new Set(combined))
}

export function isOwnerEmail(email?: string | null) {
  if (!email) return false
  return getOwnerEmails().includes(email.trim().toLowerCase())
}
