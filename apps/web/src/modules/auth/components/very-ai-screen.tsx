export function VeryAiScreen() {
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <h3 className="mt-4 mb-2 font-display font-bold">Redirecting to VeryAI...</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        You&apos;ll be taken to VeryAI to verify your identity. Once complete, you&apos;ll return
        here automatically.
      </p>
    </div>
  );
}
