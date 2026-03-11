import { POST as acceptPost } from "@/app/api/orders/accept/route"

export const runtime = "nodejs"

export async function POST(req: Request) {
  return acceptPost(req)
}
