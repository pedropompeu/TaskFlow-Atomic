import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-6">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Task<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-xl text-gray-600">
            Kanban task management with real-time analytics and proactive email alerts
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            Create account
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-2xl mb-2">🗂️</div>
            <h3 className="font-semibold text-gray-900 mb-1">Kanban Board</h3>
            <p className="text-sm text-gray-500">Drag-and-drop cards across 4 columns</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
            <p className="text-sm text-gray-500">Charts, overdue tasks, team workload</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-2xl mb-2">🔔</div>
            <h3 className="font-semibold text-gray-900 mb-1">Smart Alerts</h3>
            <p className="text-sm text-gray-500">Email alerts 24h before deadlines</p>
          </div>
        </div>
      </div>
    </main>
  );
}
