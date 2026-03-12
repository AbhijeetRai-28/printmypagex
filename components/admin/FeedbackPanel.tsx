"use client"

import { useMemo, useState } from "react"
import { MessageSquare, Search, Star } from "lucide-react"
import {
  computeOverallFeedbackRating,
  FEEDBACK_ASPECTS,
  FEEDBACK_RATING_KEYS
} from "@/lib/feedback"

export type AdminFeedback = {
  _id?: string
  uiRating: number
  easeOfUseRating: number
  workflowRating: number
  effectivenessRating: number
  performanceRating: number
  stabilityRating: number
  overallRating?: number
  message: string
  createdAt?: string
}

type FeedbackFilter = "ALL" | "POSITIVE" | "ATTENTION"

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

function getOverallRating(feedback: AdminFeedback) {
  const stored = Number(feedback.overallRating || 0)
  if (stored > 0) {
    return stored
  }

  return computeOverallFeedbackRating(feedback)
}

function getRatingTone(rating: number) {
  if (rating >= 4) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
  }

  if (rating >= 3) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
  }

  return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
}

function StaticStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < Math.round(value)

        return (
          <Star
            key={`${value}-${index}`}
            className={`h-4 w-4 ${
              filled
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        )
      })}
    </div>
  )
}

export default function FeedbackPanel({
  feedbacks
}: {
  feedbacks: AdminFeedback[]
}) {
  const [referenceNow] = useState(() => Date.now())
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FeedbackFilter>("ALL")

  const summary = useMemo(() => {
    const total = feedbacks.length

    const overallAverage = total
      ? Math.round(
          (feedbacks.reduce((sum, feedback) => sum + getOverallRating(feedback), 0) /
            total) *
            10
        ) / 10
      : 0

    const aspectAverages = FEEDBACK_ASPECTS.map((aspect) => {
      const average = total
        ? Math.round(
            (feedbacks.reduce(
              (sum, feedback) => sum + Number(feedback[aspect.key] || 0),
              0
            ) /
              total) *
              10
          ) / 10
        : 0

      return {
        ...aspect,
        average
      }
    })

    const lowestAspect = [...aspectAverages].sort(
      (left, right) => left.average - right.average
    )[0]

    const attentionCount = feedbacks.filter((feedback) => {
      const overall = getOverallRating(feedback)

      return (
        overall < 3.5 ||
        Number(feedback.performanceRating || 0) <= 2 ||
        Number(feedback.stabilityRating || 0) <= 2
      )
    }).length

    const recentCount = feedbacks.filter((feedback) => {
      if (!feedback.createdAt) return false
      const createdAt = new Date(feedback.createdAt).getTime()
      if (Number.isNaN(createdAt)) return false
      return referenceNow - createdAt <= 7 * 24 * 60 * 60 * 1000
    }).length

    return {
      total,
      overallAverage,
      aspectAverages,
      lowestAspect,
      attentionCount,
      recentCount
    }
  }, [feedbacks, referenceNow])

  const filteredFeedbacks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return feedbacks.filter((feedback) => {
      const overall = getOverallRating(feedback)

      if (filter === "POSITIVE" && overall < 4) return false
      if (
        filter === "ATTENTION" &&
        overall >= 3.5 &&
        Number(feedback.performanceRating || 0) > 2 &&
        Number(feedback.stabilityRating || 0) > 2
      ) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [
        feedback._id,
        feedback.message,
        feedback.createdAt,
        ...FEEDBACK_RATING_KEYS.map((key) => String(feedback[key] || ""))
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [feedbacks, filter, query])

  if (!feedbacks.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white/70 p-8 text-center backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
        <MessageSquare className="mx-auto h-10 w-10 text-indigo-500 dark:text-cyan-300" />
        <h3 className="mt-4 text-xl font-semibold">No feedback submissions yet</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          As soon as visitors submit the new public feedback form, responses will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-500 dark:text-cyan-300">
            Feedback Pulse
          </p>
          <h3 className="mt-3 text-2xl font-semibold">Visitor sentiment overview</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Anonymous website responses focused on UI, workflow, performance, and bugs.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: "Total Responses", value: String(summary.total) },
              { label: "Average Overall", value: `${summary.overallAverage.toFixed(1)}/5` },
              { label: "Needs Attention", value: String(summary.attentionCount) },
              { label: "Last 7 Days", value: String(summary.recentCount) }
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-black/20"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="mt-2 text-xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>

          {summary.lowestAspect ? (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                Lowest Rated Area
              </p>
              <p className="mt-1 font-medium">
                {summary.lowestAspect.label} at {summary.lowestAspect.average.toFixed(1)}/5
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Average by aspect</h3>
            <span className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs dark:border-white/10 dark:bg-white/5">
              {summary.total} total responses
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summary.aspectAverages.map((aspect) => (
              <div
                key={aspect.key}
                className={`rounded-2xl border p-4 ${getRatingTone(aspect.average)}`}
              >
                <p className="text-sm font-medium">{aspect.label}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <StaticStars value={aspect.average} />
                  <span className="text-base font-semibold">
                    {aspect.average.toFixed(1)}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-gray-200 bg-white/70 p-4 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by message, rating, or submission id..."
            className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-10 pr-3 dark:border-white/20 dark:bg-black/30"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as FeedbackFilter)}
          className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5 dark:border-white/20 dark:bg-black/30"
        >
          <option value="ALL">All Feedback</option>
          <option value="POSITIVE">Positive Only</option>
          <option value="ATTENTION">Needs Attention</option>
        </select>

        <div className="text-sm text-gray-600 dark:text-gray-300">
          Showing {filteredFeedbacks.length} of {feedbacks.length}
        </div>
      </div>

      {filteredFeedbacks.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredFeedbacks.map((feedback, index) => {
            const overall = getOverallRating(feedback)

            return (
              <article
                key={feedback._id || `feedback-${index}`}
                className="rounded-3xl border border-gray-200 bg-white/70 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-indigo-500 dark:text-cyan-300">
                      Feedback {String(feedback._id || index + 1).slice(-6)}
                    </p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Submitted {formatDateTime(feedback.createdAt)}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl border px-4 py-3 ${getRatingTone(overall)}`}
                  >
                    <p className="text-xs uppercase tracking-[0.14em]">Overall</p>
                    <p className="mt-1 text-xl font-semibold">
                      {overall.toFixed(1)}/5
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {FEEDBACK_ASPECTS.map((aspect) => {
                    const value = Number(feedback[aspect.key] || 0)

                    return (
                      <div
                        key={`${feedback._id || index}-${aspect.key}`}
                        className="rounded-2xl border border-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-black/20"
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {aspect.label}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <StaticStars value={value} />
                          <span className="font-medium">{value}/5</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-5 rounded-2xl border border-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-black/20">
                  <p className="text-xs uppercase tracking-[0.18em] text-indigo-500 dark:text-cyan-300">
                    Visitor message
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">
                    {feedback.message}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white/70 p-8 text-center backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-semibold">No feedback matches this filter</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Try a different search term or switch the sentiment filter.
          </p>
        </div>
      )}
    </div>
  )
}
