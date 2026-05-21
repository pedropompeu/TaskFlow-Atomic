import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 h-14 flex items-center">
        <div className="flex items-center justify-between w-full max-w-screen-xl mx-auto">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900">
            Task<span className="text-blue-600">Flow</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Board
            </Link>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Analytics
            </Link>
            <form action="/api/logout" method="POST">
              <button
                type="button"
                onClick={async () => {
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include',
                  });
                  window.location.href = '/login';
                }}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-screen-xl mx-auto p-6">{children}</main>
    </div>
  );
}
