"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const errorMessages: Record<string, string> = {
  AccessDenied: "Acesso negado. Você não tem permissão para acessar.",
  OAuthCallback: "Erro ao processar callback do OAuth.",
  OAuthSignin: "Erro ao fazer login com OAuth.",
  OAuthCreateAccount: "Não foi possível criar conta automaticamente com OAuth.",
  EmailCreateAccount: "Não foi possível criar conta automaticamente com email.",
  Callback: "Erro no callback de autenticação.",
  OAuthAccountNotLinked: "Email já registrado com outro método de login.",
  EmailSignInError: "Email ou senha inválidos.",
  SessionCallback: "Erro ao processar sessão.",
  CredentialsSignin: "Email ou senha inválidos.",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage =
    error && errorMessages[error]
      ? errorMessages[error]
      : "Ocorreu um erro desconhecido. Por favor, tente novamente.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">Erro de Autenticação</h1>

          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 mb-6">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Voltar para Login
            </Link>

            <Link
              href="/"
              className="inline-block w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Ir para Home
            </Link>
          </div>

          {error && (
            <div className="mt-6 pt-6 border-t border-slate-600">
              <p className="text-slate-500 text-xs">
                Código do erro: <code className="text-slate-400">{error}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
