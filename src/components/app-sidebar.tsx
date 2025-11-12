"use client";

import { useState } from "react";
import { ChevronDown, History, Settings } from "lucide-react";
import Logo from "@/components/logo";
import TranscriptionHistory from "@/components/transcription-history";
import { cn } from "@/lib/utils";
import { TranscriptionData } from "@/lib/transcription-types";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

type AppSidebarProps = {
  onRestoreTranscription?: (data: TranscriptionData) => void;
};

export default function AppSidebar({
  onRestoreTranscription,
}: AppSidebarProps) {
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-2 border-b border-border scale-75 origin-top-left">
        <Logo />
      </div>

      {/* Histórico */}
      <div className="flex-1 overflow-y-auto border-b border-border">
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent/50 transition-colors text-sm"
        >
          <div className="flex items-center gap-2">
            <History className="w-3 h-3" />
            <span className="font-medium text-xs">Histórico</span>
          </div>
          <ChevronDown
            className={cn(
              "w-3 h-3 transition-transform",
              historyExpanded ? "" : "-rotate-90"
            )}
          />
        </button>
        {historyExpanded && (
          <div className="px-2 py-1 bg-accent/20">
            {onRestoreTranscription && (
              <TranscriptionHistory onRestore={onRestoreTranscription} />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-2">
        {user?.role === 'admin' ? (
          <Link 
            href="/admin" 
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-amber-900/30 transition-colors bg-amber-950/20 border border-amber-800/50"
            title="Painel de Administração"
          >
            <Settings size={16} />
            <span>Painel Admin</span>
          </Link>
        ) : null}
        <a 
          href="mailto:marcusantonio@id.uff.br" 
          className="text-xs text-muted-foreground hover:text-primary transition-colors text-center block"
          title="Contato do desenvolvedor"
        >
          📧 marcusantonio@id.uff.br
        </a>
      </div>
    </div>
  );
}
