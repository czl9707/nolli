export function PortfolioItem({children}: {children: React.ReactNode}) {
  return (
    <div className="w-[min(600px,100vw)] shrink-0 h-full p-12 not-first:border-l border-border duration-500 ease-in-out">
      {children}
    </div>
   )
}