export function LoadingSpinner() {
  const isLoaderEnabled = false;

  if (!isLoaderEnabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
      <div className="flex flex-col items-center rounded-2xl border border-white/20 bg-[#11131b]/70 px-8 py-6 shadow-lg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f63a9e] motion-reduce:animate-none" />
        <p className="mt-4 text-sm font-medium text-white/90">Loading...</p>
      </div>
    </div>
  );
}
