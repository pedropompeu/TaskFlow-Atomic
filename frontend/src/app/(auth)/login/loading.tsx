export default function LoginLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
      <div className="mb-8 text-center space-y-2">
        <div className="h-7 w-32 bg-gray-200 rounded mx-auto" />
        <div className="h-4 w-40 bg-gray-100 rounded mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 bg-blue-100 rounded-lg mt-2" />
      </div>
    </div>
  );
}
