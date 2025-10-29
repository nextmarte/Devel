export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full bg-primary opacity-75 animate-pulse-glow"></div>
        <div className="absolute inset-2 rounded-full bg-primary"></div>
      </div>
      <p className="text-muted-foreground animate-pulse">Processando transcrição...</p>
    </div>
  );
}
