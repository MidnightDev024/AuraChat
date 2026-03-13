const MessageSkeleton = () => {
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-3 pb-6 flex flex-col gap-4">
      {skeletonMessages.map((_, idx) => {
        const isSender = idx % 2 !== 0;
        return (
          <div
            key={idx}
            className={`flex items-end gap-2 ${isSender ? "justify-end" : "justify-start"}`}
          >
            {!isSender && (
              <div className="w-7 h-7 rounded-full bg-white/20 animate-pulse shrink-0" />
            )}
            <div className="flex flex-col gap-1 max-w-[200px]">
              <div
                className={`h-10 rounded-lg bg-white/15 animate-pulse ${
                  isSender ? "w-36" : "w-48"
                }`}
              />
              <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
            </div>
            {isSender && (
              <div className="w-7 h-7 rounded-full bg-white/20 animate-pulse shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageSkeleton;
