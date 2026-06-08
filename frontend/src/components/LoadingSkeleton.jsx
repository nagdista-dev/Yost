export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-yt-bg-card rounded-xl p-4 animate-pulse border border-yt-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yt-bg-tertiary rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-yt-bg-tertiary rounded w-32 mb-1" />
              <div className="h-3 bg-yt-bg-tertiary rounded w-20" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-yt-bg-tertiary rounded w-full" />
            <div className="h-3 bg-yt-bg-tertiary rounded w-3/4" />
            <div className="h-3 bg-yt-bg-tertiary rounded w-1/2" />
          </div>
          <div className="h-48 bg-yt-bg-tertiary rounded-lg mb-4" />
          <div className="flex gap-4">
            <div className="h-4 bg-yt-bg-tertiary rounded w-16" />
            <div className="h-4 bg-yt-bg-tertiary rounded w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
