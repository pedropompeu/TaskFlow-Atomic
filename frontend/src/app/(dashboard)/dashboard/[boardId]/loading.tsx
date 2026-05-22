export default function BoardLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        <div className="h-7 w-48 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-72 shrink-0 space-y-2">
            <div className="h-10 bg-white border border-gray-200 rounded-t-xl border-t-4 border-t-gray-300" />
            <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-2 space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-20 bg-white rounded-lg border border-gray-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
