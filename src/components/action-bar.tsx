"use client";

import TranscriptionActions from "@/components/transcription-actions";
import { cn } from "@/lib/utils";

type ActionBarProps = {
  text: string;
  isVisible: boolean;
  title?: string;
};

export default function ActionBar({ text, isVisible, title = "Transcrição" }: ActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border shadow-lg transition-all duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
        <TranscriptionActions text={text} title={title} />
      </div>
    </div>
  );
}
