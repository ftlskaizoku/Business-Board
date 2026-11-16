// Shown instantly while a page's data loads, so tapping a tab gives
// immediate feedback instead of a frozen screen.
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="h-3 w-24 rounded-full bg-line mb-2" />
      <div className="h-7 w-48 rounded-full bg-line mb-6" />
      <div className="h-36 rounded-[20px] bg-line mb-3" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="h-24 rounded-[20px] bg-line" />
        <div className="h-24 rounded-[20px] bg-line" />
      </div>
      <div className="space-y-2">
        <div className="h-14 rounded-2xl bg-line" />
        <div className="h-14 rounded-2xl bg-line" />
        <div className="h-14 rounded-2xl bg-line" />
      </div>
    </div>
  );
}
