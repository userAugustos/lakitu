export function CriticalToolBanner() {
  return (
    <div
      data-testid="critical-tool-banner"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      This tool is critical risk. Every request will require manual approval. Auto-approve is not
      available.
    </div>
  );
}
