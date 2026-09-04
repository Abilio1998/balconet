export default function SalaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="p-4 md:p-10 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
