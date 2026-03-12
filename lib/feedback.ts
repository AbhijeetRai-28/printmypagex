export const FEEDBACK_ASPECTS = [
  {
    key: "uiRating",
    label: "UI & visual design",
    description: "How polished and clear the website looks."
  },
  {
    key: "easeOfUseRating",
    label: "User friendliness",
    description: "How easy it is to understand and use."
  },
  {
    key: "workflowRating",
    label: "Workflow clarity",
    description: "How smooth the step-by-step flow feels."
  },
  {
    key: "effectivenessRating",
    label: "Gets the job done",
    description: "How well the website helps you finish the task."
  },
  {
    key: "performanceRating",
    label: "Performance",
    description: "How fast and responsive the website feels."
  },
  {
    key: "stabilityRating",
    label: "Bug-free experience",
    description: "How stable the website feels while using it."
  }
] as const

export type FeedbackAspectKey = (typeof FEEDBACK_ASPECTS)[number]["key"]

export type FeedbackRatings = Record<FeedbackAspectKey, number>

export const FEEDBACK_RATING_KEYS = FEEDBACK_ASPECTS.map(
  (aspect) => aspect.key
) as FeedbackAspectKey[]

export function parseFeedbackRatings(
  source: Record<string, unknown>
): FeedbackRatings | null {
  const ratings = {} as FeedbackRatings

  for (const key of FEEDBACK_RATING_KEYS) {
    const value = Number(source[key])

    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return null
    }

    ratings[key] = value
  }

  return ratings
}

export function computeOverallFeedbackRating(
  ratings: Partial<Record<FeedbackAspectKey, number>>
) {
  const values = FEEDBACK_RATING_KEYS
    .map((key) => Number(ratings[key] || 0))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (!values.length) {
    return 0
  }

  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round((total / values.length) * 10) / 10
}
