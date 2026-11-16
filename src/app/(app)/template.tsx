// A template (unlike a layout) re-mounts on every navigation, which replays
// this soft fade-in each time the user changes tab.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
