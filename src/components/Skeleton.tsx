const SkeletonPulse = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
  
  // Skeleton for Grid Cards
  const CardSkeleton = () => (
    <div className="border rounded-xl overflow-hidden bg-white p-4">
      <SkeletonPulse className="h-48 w-full mb-4" />
      <SkeletonPulse className="h-6 w-3/4 mb-2" />
      <SkeletonPulse className="h-4 w-1/2 mb-4" />
      <div className="flex justify-between">
        <SkeletonPulse className="h-4 w-1/4" />
        <SkeletonPulse className="h-4 w-1/4" />
      </div>
    </div>
  );
  
  // Skeleton for Table Rows
  const TableSkeleton = () => (
    <div className="w-full border rounded-xl overflow-hidden bg-white">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex border-b p-4 gap-4 items-center">
          <SkeletonPulse className="h-4 w-1/3" />
          <SkeletonPulse className="h-4 w-1/4" />
          <SkeletonPulse className="h-4 w-12 ml-auto" />
          <SkeletonPulse className="h-4 w-12" />
        </div>
      ))}
    </div>
  );