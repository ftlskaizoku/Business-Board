// Shown instantly while a page's data loads, so tapping a tab gives
// immediate feedback instead of a frozen screen.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-3 w-24 rounded-full mb-2.5" />
      <div className="skeleton h-8 w-52 rounded-full mb-6" />
      <div className="skeleton h-40 rounded-[20px] mb-3" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="skeleton h-24 rounded-[20px]" />
        <div className="skeleton h-24 rounded-[20px]" />
      </div>
      <div className="space-y-2.5">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="skeleton h-16 rounded-2xl" />
        <div className="skeleton h-16 rounded-2xl" />
      </div>
    </div>
  );
}
