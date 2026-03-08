import { NextResponse } from "next/server"
import { authenticateSupplierRequest } from "@/lib/supplier-auth"
import SupplierPayoutRequest from "@/models/SupplierPayoutRequest"
import { getSupplierWalletSummary } from "@/lib/supplier-wallet"

export async function GET(req: Request) {
  const auth = await authenticateSupplierRequest(req)
  if (!auth.ok) return auth.response

  const [wallet, requests] = await Promise.all([
    getSupplierWalletSummary(auth.uid),
    SupplierPayoutRequest.find({ supplierUID: auth.uid })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
  ])

  return NextResponse.json({
    success: true,
    wallet,
    requests
  })
}
