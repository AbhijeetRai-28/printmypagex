"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import RoleGuard from "@/components/RoleGuard"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

type Tab = "overview" | "users" | "suppliers" | "orders" | "payments" | "payouts" | "danger"

type OverviewResponse = {
  stats: {
    totalUsers: number
    activeUsers: number
    totalSuppliers: number
    approvedSuppliers: number
    activeSuppliers: number
    totalOrders: number
    paidOrders: number
    pendingOrders: number
    totalRevenue: number
  }
  charts: {
    statusBreakdown: Array<{ status: string; count: number }>
    paymentTrend: Array<{ date: string; amount: number }>
    orderTrend: Array<{ date: string; orders: number }>
  }
}

type AdminUser = {
  _id?: string
  firebaseUID?: string
  name?: string
  email?: string
  role: "USER" | "SUPPLIER" | "ADMIN"
  approved?: boolean
  active?: boolean
  orderCount?: number
  totalSpent?: number
}

type AdminSupplier = {
  _id?: string
  firebaseUID?: string
  name?: string
  email?: string
  approved?: boolean
  active?: boolean
  ordersHandled?: number
  paidOrders?: number
  grossDeliveredRevenue?: number
  razorpayFees?: number
  gstOnFees?: number
  netRevenue?: number
  totalClaimed?: number
  pendingRequested?: number
  walletBalance?: number
  availableToClaim?: number
}

type AdminOrder = {
  _id: string
  userUID: string
  supplierUID?: string | null
  user?: { name?: string; email?: string }
  supplier?: { name?: string }
  status: string
  paymentStatus: string
  pages?: number
  verifiedPages?: number
  estimatedPrice?: number
  finalPrice?: number
  createdAt: string
}

type PaymentLog = {
  orderId: string
  userUID: string
  user?: { name?: string; email?: string }
  amount: number
  paymentStatus: string
  razorpayPaymentId?: string
  paidAt?: string | null
}

type AdminPayoutRequest = {
  _id: string
  supplierUID: string
  amount: number
  status: "pending" | "approved" | "rejected"
  note?: string
  createdAt: string
  processedAt?: string | null
  supplier?: { name?: string; email?: string; phone?: string }
}

type ClearDbResponse = {
  deleted: {
    users: number
    suppliers: number
    orders: number
  }
}

const COLORS = ["#22d3ee", "#fb7185", "#34d399", "#f59e0b", "#818cf8", "#f87171", "#c084fc"]

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Request failed"
}

export default function AdminPortalPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [payments, setPayments] = useState<PaymentLog[]>([])
  const [payoutRequests, setPayoutRequests] = useState<AdminPayoutRequest[]>([])

  const [confirmPhrase, setConfirmPhrase] = useState("")
  const [confirmOwnerEmail, setConfirmOwnerEmail] = useState("")
  const [busyAction, setBusyAction] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const adminFetch = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("No signed-in admin")
    }

    const idToken = await currentUser.getIdToken(true)
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        ...(init?.headers || {})
      }
    })

    const data = (await res.json()) as { message?: string } & T
    if (!res.ok) {
      throw new Error(data?.message || "Request failed")
    }

    return data
  }, [])

  const loadAll = useCallback(async () => {
    setError("")
    setMessage("")

    const [overviewRes, usersRes, suppliersRes, ordersRes, paymentsRes, payoutsRes] = await Promise.all([
      adminFetch<OverviewResponse>("/api/admin/overview"),
      adminFetch<{ users: AdminUser[] }>("/api/admin/users"),
      adminFetch<{ suppliers: AdminSupplier[] }>("/api/admin/suppliers"),
      adminFetch<{ orders: AdminOrder[] }>("/api/admin/orders"),
      adminFetch<{ payments: PaymentLog[] }>("/api/admin/payments"),
      adminFetch<{ requests: AdminPayoutRequest[] }>("/api/admin/payout-requests")
    ])

    setOverview(overviewRes)
    setUsers(usersRes.users || [])
    setSuppliers(suppliersRes.suppliers || [])
    setOrders(ordersRes.orders || [])
    setPayments(paymentsRes.payments || [])
    setPayoutRequests(payoutsRes.requests || [])
  }, [adminFetch])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/admin/login"
        return
      }

      try {
        await loadAll()
      } catch (err: unknown) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [loadAll])

  const runUserAction = async (firebaseUID: string, action: string, role?: string) => {
    try {
      setBusyAction(`${action}-${firebaseUID}`)
      await adminFetch<{ success: boolean }>("/api/admin/user-action", {
        method: "POST",
        body: JSON.stringify({ firebaseUID, action, role })
      })
      await loadAll()
      setMessage("User updated successfully")
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setBusyAction("")
    }
  }

  const runSupplierAction = async (firebaseUID: string, action: string) => {
    try {
      setBusyAction(`${action}-${firebaseUID}`)
      await adminFetch<{ success: boolean }>("/api/admin/supplier-action", {
        method: "POST",
        body: JSON.stringify({ firebaseUID, action })
      })
      await loadAll()
      setMessage("Supplier updated successfully")
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setBusyAction("")
    }
  }

  const runPayoutAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      setBusyAction(`${action}-${requestId}`)
      await adminFetch<{ success: boolean }>("/api/admin/payout-requests", {
        method: "POST",
        body: JSON.stringify({ requestId, action })
      })
      await loadAll()
      setMessage(`Payout request ${action}d successfully`)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setBusyAction("")
    }
  }

  const clearDatabase = async () => {
    try {
      setBusyAction("clear-db")
      const data = await adminFetch<ClearDbResponse>("/api/admin/database/clear", {
        method: "POST",
        body: JSON.stringify({
          confirmText: confirmPhrase,
          ownerEmail: confirmOwnerEmail
        })
      })

      setMessage(
        `Database cleared. Deleted users: ${data.deleted.users}, suppliers: ${data.deleted.suppliers}, orders: ${data.deleted.orders}`
      )
      setConfirmPhrase("")
      setConfirmOwnerEmail("")
      await loadAll()
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setBusyAction("")
    }
  }

  const topCards = useMemo(() => {
    if (!overview) return []
    return [
      { label: "Users", value: overview.stats.totalUsers },
      { label: "Suppliers", value: overview.stats.totalSuppliers },
      { label: "Orders", value: overview.stats.totalOrders },
      { label: "Revenue", value: `INR ${overview.stats.totalRevenue}` },
      { label: "Paid Orders", value: overview.stats.paidOrders },
      { label: "Pending Orders", value: overview.stats.pendingOrders }
    ]
  }, [overview])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p>Loading secure admin portal...</p>
      </div>
    )
  }

  const tabs: Array<{ value: Tab; label: string }> = [
    { value: "overview", label: "Overview" },
    { value: "users", label: "Users" },
    { value: "suppliers", label: "Suppliers" },
    { value: "orders", label: "Orders" },
    { value: "payments", label: "Payments" },
    { value: "payouts", label: "Payout Requests" },
    { value: "danger", label: "Danger Zone" }
  ]

  return (
    <RoleGuard role="ADMIN">
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-cyan-400 text-xs uppercase tracking-[0.25em]">Owner Control Center</p>
              <h1 className="text-3xl font-bold">Admin Portal</h1>
            </div>
            <button
              onClick={loadAll}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700"
            >
              Refresh Data
            </button>
          </div>

          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          {message ? <p className="text-emerald-400 text-sm">{message}</p> : null}

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === tab.value
                    ? "bg-cyan-400 text-slate-900 border-cyan-300"
                    : "bg-slate-900 border-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && overview ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
                {topCards.map((card) => (
                  <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400">{card.label}</p>
                    <h2 className="text-xl font-semibold mt-1">{card.value}</h2>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[320px]">
                  <h3 className="font-semibold mb-3">Daily Order Trend</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overview.charts.orderTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" hide={overview.charts.orderTrend.length > 12} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="orders" stroke="#22d3ee" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[320px]">
                  <h3 className="font-semibold mb-3">Daily Payment Revenue</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.charts.paymentTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" hide={overview.charts.paymentTrend.length > 12} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" fill="#34d399" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[360px]">
                <h3 className="font-semibold mb-3">Order Status Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview.charts.statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {overview.charts.statusBreakdown.map((entry, index) => (
                        <Cell key={`${entry.status}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {activeTab === "users" ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Approved</th>
                    <th className="text-left p-3">Active</th>
                    <th className="text-left p-3">Orders</th>
                    <th className="text-left p-3">Spent</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.firebaseUID || user._id || `user-${idx}`} className="border-t border-slate-800">
                      <td className="p-3">{user.name || "-"}</td>
                      <td className="p-3">{user.email || "-"}</td>
                      <td className="p-3">{user.role}</td>
                      <td className="p-3">{user.approved ? "Yes" : "No"}</td>
                      <td className="p-3">{user.active ? "Yes" : "No"}</td>
                      <td className="p-3">{user.orderCount || 0}</td>
                      <td className="p-3">INR {user.totalSpent || 0}</td>
                      <td className="p-3">
                        {user.firebaseUID ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={busyAction === `activate-${user.firebaseUID}`}
                              onClick={() => runUserAction(user.firebaseUID!, "activate")}
                              className="px-2 py-1 rounded bg-emerald-700"
                            >
                              Unsuspend
                            </button>
                            <button
                              disabled={busyAction === `deactivate-${user.firebaseUID}`}
                              onClick={() => runUserAction(user.firebaseUID!, "deactivate")}
                              className="px-2 py-1 rounded bg-amber-600"
                            >
                              Suspend
                            </button>
                            <button
                              disabled={busyAction === `approve-${user.firebaseUID}`}
                              onClick={() => runUserAction(user.firebaseUID!, "approve")}
                              className="px-2 py-1 rounded bg-cyan-700"
                            >
                              Approve
                            </button>
                            <button
                              disabled={busyAction === `disapprove-${user.firebaseUID}`}
                              onClick={() => runUserAction(user.firebaseUID!, "disapprove")}
                              className="px-2 py-1 rounded bg-rose-700"
                            >
                              Disapprove
                            </button>
                            <select
                              value={user.role}
                              onChange={(e) => runUserAction(user.firebaseUID!, "set_role", e.target.value)}
                              className="px-2 py-1 rounded bg-slate-800 border border-slate-700"
                            >
                              <option value="USER">USER</option>
                              <option value="SUPPLIER">SUPPLIER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                              disabled={busyAction === `delete-${user.firebaseUID}`}
                              onClick={() => runUserAction(user.firebaseUID!, "delete")}
                              className="px-2 py-1 rounded bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "suppliers" ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[1800px] text-sm">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Approved</th>
                    <th className="text-left p-3">Active</th>
                    <th className="text-left p-3">Orders</th>
                    <th className="text-left p-3">Paid Orders</th>
                    <th className="text-left p-3">Gross Delivered</th>
                    <th className="text-left p-3">Razorpay Fees</th>
                    <th className="text-left p-3">GST on Fees</th>
                    <th className="text-left p-3">Net Revenue</th>
                    <th className="text-left p-3">Claimed</th>
                    <th className="text-left p-3">Pending Req</th>
                    <th className="text-left p-3">Wallet</th>
                    <th className="text-left p-3">Available</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier, idx) => (
                    <tr key={supplier.firebaseUID || supplier._id || `sup-${idx}`} className="border-t border-slate-800">
                      <td className="p-3">{supplier.name || "-"}</td>
                      <td className="p-3">{supplier.email || "-"}</td>
                      <td className="p-3">{supplier.approved ? "Yes" : "No"}</td>
                      <td className="p-3">{supplier.active ? "Yes" : "No"}</td>
                      <td className="p-3">{supplier.ordersHandled || 0}</td>
                      <td className="p-3">{supplier.paidOrders || 0}</td>
                      <td className="p-3">INR {supplier.grossDeliveredRevenue || 0}</td>
                      <td className="p-3">INR {supplier.razorpayFees || 0}</td>
                      <td className="p-3">INR {supplier.gstOnFees || 0}</td>
                      <td className="p-3">INR {supplier.netRevenue || 0}</td>
                      <td className="p-3">INR {supplier.totalClaimed || 0}</td>
                      <td className="p-3">INR {supplier.pendingRequested || 0}</td>
                      <td className="p-3">INR {supplier.walletBalance || 0}</td>
                      <td className="p-3">INR {supplier.availableToClaim || 0}</td>
                      <td className="p-3">
                        {supplier.firebaseUID ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={busyAction === `approve-${supplier.firebaseUID}`}
                              onClick={() => runSupplierAction(supplier.firebaseUID!, "approve")}
                              className="px-2 py-1 rounded bg-cyan-700"
                            >
                              Approve
                            </button>
                            <button
                              disabled={busyAction === `disapprove-${supplier.firebaseUID}`}
                              onClick={() => runSupplierAction(supplier.firebaseUID!, "disapprove")}
                              className="px-2 py-1 rounded bg-rose-700"
                            >
                              Disapprove
                            </button>
                            <button
                              disabled={busyAction === `activate-${supplier.firebaseUID}`}
                              onClick={() => runSupplierAction(supplier.firebaseUID!, "activate")}
                              className="px-2 py-1 rounded bg-emerald-700"
                            >
                              Activate
                            </button>
                            <button
                              disabled={busyAction === `deactivate-${supplier.firebaseUID}`}
                              onClick={() => runSupplierAction(supplier.firebaseUID!, "deactivate")}
                              className="px-2 py-1 rounded bg-amber-600"
                            >
                              Inactivate
                            </button>
                            <button
                              disabled={busyAction === `delete-${supplier.firebaseUID}`}
                              onClick={() => runSupplierAction(supplier.firebaseUID!, "delete")}
                              className="px-2 py-1 rounded bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "orders" ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="text-left p-3">Order ID</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Supplier</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Payment</th>
                    <th className="text-left p-3">Pages</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-t border-slate-800">
                      <td className="p-3">{String(order._id)}</td>
                      <td className="p-3">
                        {order.user?.name || "Unknown"}
                        <br />
                        <span className="text-slate-400">{order.user?.email || order.userUID}</span>
                      </td>
                      <td className="p-3">{order.supplier?.name || "Unassigned"}</td>
                      <td className="p-3">{order.status}</td>
                      <td className="p-3">{order.paymentStatus}</td>
                      <td className="p-3">{order.verifiedPages || order.pages || 0}</td>
                      <td className="p-3">INR {order.finalPrice ?? order.estimatedPrice ?? 0}</td>
                      <td className="p-3">{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "payments" ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="text-left p-3">Order</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Razorpay Payment ID</th>
                    <th className="text-left p-3">Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.orderId} className="border-t border-slate-800">
                      <td className="p-3">{payment.orderId}</td>
                      <td className="p-3">{payment.user?.name || payment.user?.email || payment.userUID}</td>
                      <td className="p-3">INR {payment.amount}</td>
                      <td className="p-3">{payment.paymentStatus}</td>
                      <td className="p-3">{payment.razorpayPaymentId || "-"}</td>
                      <td className="p-3">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "payouts" ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[1300px] text-sm">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="text-left p-3">Supplier</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Requested At</th>
                    <th className="text-left p-3">Processed At</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutRequests.map((request) => (
                    <tr key={request._id} className="border-t border-slate-800">
                      <td className="p-3">{request.supplier?.name || request.supplierUID}</td>
                      <td className="p-3">{request.supplier?.email || "-"}</td>
                      <td className="p-3">INR {request.amount}</td>
                      <td className="p-3">{request.status}</td>
                      <td className="p-3">{new Date(request.createdAt).toLocaleString()}</td>
                      <td className="p-3">{request.processedAt ? new Date(request.processedAt).toLocaleString() : "-"}</td>
                      <td className="p-3">
                        {request.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              disabled={busyAction === `approve-${request._id}`}
                              onClick={() => runPayoutAction(request._id, "approve")}
                              className="px-2 py-1 rounded bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              disabled={busyAction === `reject-${request._id}`}
                              onClick={() => runPayoutAction(request._id, "reject")}
                              className="px-2 py-1 rounded bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          "Processed"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "danger" ? (
            <div className="bg-red-950/30 border border-red-700 rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-red-300">Danger Zone: Clear Entire Database</h3>
              <p className="text-sm text-red-200">
                This removes all users (except admins), all suppliers, and all orders permanently.
              </p>

              <div className="space-y-3 max-w-xl">
                <input
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="Type: CLEAR ENTIRE DATABASE"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                />
                <input
                  value={confirmOwnerEmail}
                  onChange={(e) => setConfirmOwnerEmail(e.target.value)}
                  placeholder="Type your owner email"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                />
                <button
                  disabled={busyAction === "clear-db"}
                  onClick={clearDatabase}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-60"
                >
                  {busyAction === "clear-db" ? "Clearing..." : "Clear Database"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </RoleGuard>
  )
}
