export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 animate-gradient-bg"
      style={{
        backgroundImage: 'linear-gradient(-45deg, #FFF7ED, #FFFCF7, #FEF3C7, #FEE2E2)',
      }}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
