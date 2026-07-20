export default function StorefrontLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-24">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent motion-reduce:animate-none"
        role="status"
        aria-label="Yükleniyor"
      />
    </div>
  );
}
