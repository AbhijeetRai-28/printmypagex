import Navbar from "@/components/Navbar"
import FeedbackFormCard from "@/components/FeedbackFormCard"
import CreatorFooter from "@/components/CreatorFooter"
import HeroBackground from "@/components/HeroBackground"
import CursorDepth from "@/components/CursorDepth"
import { FEEDBACK_ASPECTS } from "@/lib/feedback"

export default function FeedbackPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-gray-900 dark:bg-black dark:text-white">
      <CursorDepth />
      <Navbar />

      <section className="relative px-6 pb-16">
        <HeroBackground />

        <div className="relative mx-auto max-w-6xl space-y-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-500 dark:text-cyan-300">
              Anonymous Website Feedback
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Help us improve{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                PrintMyPage
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm text-gray-600 dark:text-gray-300 sm:text-base">
              Rate the UI, user friendliness, workflow, performance, and overall reliability.
              It takes less than a minute and no login is needed.
            </p>
          </div>

          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="rounded-[30px] border border-gray-200 bg-white/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.24em] text-indigo-500 dark:text-cyan-300">
                  Why this page exists
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  Real feedback, directly from visitors
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  We want honest feedback from anyone who uses the site, even if they never create
                  an account. This helps us improve the printing workflow, polish the UI, and catch
                  bugs earlier.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    "No login required",
                    "Takes under 1 minute",
                    "Seen by admin team"
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium dark:border-white/10 dark:bg-black/20"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-gray-200 bg-white/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.24em] text-indigo-500 dark:text-cyan-300">
                  What you will rate
                </p>
                <div className="mt-5 grid gap-3">
                  {FEEDBACK_ASPECTS.map((aspect) => (
                    <div
                      key={aspect.key}
                      className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-4 dark:border-white/10 dark:bg-black/20"
                    >
                      <p className="font-semibold">{aspect.label}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {aspect.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <FeedbackFormCard />
          </div>

          <div className="pt-4">
            <CreatorFooter />
          </div>
        </div>
      </section>
    </div>
  )
}
