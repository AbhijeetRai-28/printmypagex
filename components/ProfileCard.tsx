import { useState } from "react"

type ProfileCardData = {
  name?: string
  email?: string
  phone?: string
  rollNo?: string
  branch?: string
  year?: string | number
  section?: string
  photoURL?: string
  firebasePhotoURL?: string
  displayPhotoURL?: string
}

type ProfileCardProps = {
  title: string
  profile: ProfileCardData | null | undefined
}

export default function ProfileCard({ title, profile }: ProfileCardProps) {
  const name = profile?.name || "Unknown"
  const initial = name.charAt(0).toUpperCase() || "U"
  const resolvedPhotoURL =
    profile?.displayPhotoURL ||
    profile?.photoURL ||
    profile?.firebasePhotoURL ||
    ""
  const [failedURL, setFailedURL] = useState("")

  if (!profile) return null

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-4 text-center">{title}</p>

      <div className="flex justify-center mb-3">
        {resolvedPhotoURL && failedURL !== resolvedPhotoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedPhotoURL}
            alt={name}
            onError={() => setFailedURL(resolvedPhotoURL)}
            className="w-20 h-20 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-500/30 border border-indigo-300/30 flex items-center justify-center text-2xl font-bold text-indigo-200">
            {initial}
          </div>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <p><span className="text-gray-400">Name:</span> {name}</p>
        {profile.email ? <p><span className="text-gray-400">Email:</span> {profile.email}</p> : null}
        {profile.phone ? <p><span className="text-gray-400">Phone:</span> {profile.phone}</p> : null}
        {profile.rollNo ? <p><span className="text-gray-400">Roll No:</span> {profile.rollNo}</p> : null}
        {profile.branch ? <p><span className="text-gray-400">Branch:</span> {profile.branch}</p> : null}
        {profile.section ? <p><span className="text-gray-400">Section:</span> {profile.section}</p> : null}
        {profile.year ? <p><span className="text-gray-400">Year:</span> {profile.year}</p> : null}
      </div>
    </div>
  )
}
