import { NextResponse } from "next/server"
import { authenticateSupplierRequest } from "@/lib/supplier-auth"
import SupplierPayoutRequest from "@/models/SupplierPayoutRequest"
import { getSupplierWalletSummary } from "@/lib/supplier-wallet"

export async function POST(req: Request) {
  const auth = await authenticateSupplierRequest(req)
  if (!auth.ok) return auth.response

  const body = await req.json()
  const amount = Number(body.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, message: "Amount must be greater than 0" },
      { status: 400 }
    )
  }

  const normalizedAmount = Math.round(amount * 100) / 100

  const wallet = await getSupplierWalletSummary(auth.uid)

  if (normalizedAmount > wallet.availableToClaim) {
    return NextResponse.json(
      {
        success: false,
        message: `Amount exceeds available balance (${wallet.availableToClaim})`
      },
      { status: 400 }
    )
  }

  const request = await SupplierPayoutRequest.create({
    supplierUID: auth.uid,
    amount: normalizedAmount,
    status: "pending"
  })

  return NextResponse.json({
    success: true,
    request
  })
}
