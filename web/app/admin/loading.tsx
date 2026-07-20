export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent motion-reduce:animate-none"
        role="status"
        aria-label="Yükleniyor"
      />
    </div>
  );
}
