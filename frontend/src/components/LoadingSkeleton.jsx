export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-yt-bg-card rounded-xl p-4 md:p-6 animate-pulse border border-yt-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yt-bg-tertiary rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-yt-bg-tertiary rounded w-48 mb-1.5" />
              <div className="h-3 bg-yt-bg-tertiary rounded w-28" />
            </div>
          </div>
          <div className="space-y-2.5 mb-4">
            <div className="h-3 bg-yt-bg-tertiary rounded w-full" />
            <div className="h-3 bg-yt-bg-tertiary rounded w-5/6" />
            <div className="h-3 bg-yt-bg-tertiary rounded w-2/3" />
          </div>
          <div className="flex gap-4 pt-2 border-t border-yt-border">
            <div className="h-4 bg-yt-bg-tertiary rounded w-16" />
            <div className="h-4 bg-yt-bg-tertiary rounded w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}
