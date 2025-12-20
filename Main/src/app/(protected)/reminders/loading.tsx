export default function Loading() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-96 bg-slate-200 rounded-lg animate-pulse mt-2"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-slate-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}