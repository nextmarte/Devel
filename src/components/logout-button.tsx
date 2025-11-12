'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ 
      redirect: true,
      callbackUrl: '/auth/signin',
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sair
    </button>
  );
}
