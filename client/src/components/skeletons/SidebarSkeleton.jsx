const SidebarSkeleton = () => {
  return (
    <div className="h-full p-5 rounded-r-xl overflow-y-hidden bg-[#8185B2]/10">
      {/* Header */}
      <div className="flex justify-between items-center pb-5">
        <div className="h-8 w-32 bg-white/20 animate-pulse rounded-md" />
        <div className="h-6 w-6 bg-white/20 animate-pulse rounded-md" />
      </div>

      {/* Search bar */}
      <div className="h-10 w-full bg-white/15 animate-pulse rounded-full mb-7" />

      {/* User list */}
      <div className="flex flex-col gap-3">
        {Array(6)
          .fill(null)
          .map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 pl-4">
              <div className="w-9 h-9 rounded-full bg-white/20 animate-pulse shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-3.5 w-24 bg-white/20 animate-pulse rounded" />
                <div className="h-3 w-14 bg-white/15 animate-pulse rounded" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SidebarSkeleton;
