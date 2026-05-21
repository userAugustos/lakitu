export function VeryAiScreen() {
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <span className="border-muted-foreground size-6 animate-spin rounded-full border-2 border-t-transparent" />
      <h3 className="font-display mt-4 mb-2 font-bold">Redirecting to VeryAI...</h3>
      <p className="text-muted-foreground max-w-xs text-sm">
        You&apos;ll be taken to VeryAI to verify your identity. Once complete, you&apos;ll return
        here automatically.
      </p>
    </div>
  );
}
