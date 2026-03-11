import Pusher from "pusher-js"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import type { ChannelAuthorizationCallback } from "pusher-js"

type ChannelAuthorizationData = Exclude<Parameters<ChannelAuthorizationCallback>[1], null>

async function getCurrentUser() {
  let user = auth.currentUser
  if (user) return user

  user = await new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      unsubscribe()
      resolve(nextUser)
    })
  })

  return user
}

export const pusherClient = new Pusher(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authorizer: (channel) => ({
      authorize: (socketId: string, callback: ChannelAuthorizationCallback): void => {
        void (async () => {
          try {
            const user = await getCurrentUser()
            if (!user) {
              callback(new Error("Authentication required"), null)
              return
            }

            const token = await user.getIdToken()

            const res = await fetch("/api/pusher/auth", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name
              })
            })

            const payload = await res.json().catch(() => null)
            if (!res.ok) {
              const message =
                payload &&
                typeof payload === "object" &&
                "message" in payload &&
                typeof payload.message === "string"
                  ? payload.message
                  : "Pusher auth failed"
              callback(new Error(message), null)
              return
            }

            callback(null, payload as ChannelAuthorizationData)
          } catch (error) {
            callback(error instanceof Error ? error : new Error("Pusher auth failed"), null)
          }
        })()
      }
    })
  }
)
