import React from 'react';

export default function SkeletonLoader({ type = "card", count = 2 }) {
  const renderSkeleton = () => {
    switch (type) {
      case "pair":
        return (
          <div className="rounded-2xl border border-white/[0.03] bg-slate-900/10 p-5 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-slate-800 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-800 rounded w-1/3" />
                <div className="h-2 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
            <div className="w-24 h-8 bg-slate-800 rounded-xl" />
          </div>
        );
      case "summary":
        return (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-white/[0.04] p-5 rounded-2xl bg-[#0f1117]/30 space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="space-y-2">
                  <div className="h-2.5 bg-slate-850 rounded w-full" />
                  <div className="h-2.5 bg-slate-850 rounded w-5/6" />
                  <div className="h-2.5 bg-slate-850 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        );
      case "card":
      default:
        return (
          <div className="border border-white/[0.04] p-5 rounded-2xl bg-[#0f1117]/40 h-40 flex flex-col justify-between animate-pulse">
            <div className="space-y-2">
              <div className="h-3 bg-slate-800 rounded w-1/3" />
              <div className="h-2 bg-slate-850 rounded w-2/3" />
            </div>
            <div className="h-8 bg-slate-800 rounded-xl w-full" />
          </div>
        );
    }
  };

  return (
    <div className="grid gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </div>
  );
}
