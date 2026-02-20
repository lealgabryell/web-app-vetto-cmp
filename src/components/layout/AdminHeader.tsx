"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, UserCircle, LogOut } from "lucide-react";
import Cookie from "js-cookie";

export default function AdminHeader() {
  const pathname = usePathname();

  const handleLogout = () => {
    Cookie.remove("user_token");
    Cookie.remove("user_role");
    window.location.href = "/login";
  };

  const navItems = [
    { name: "Contratos", href: "/admin", icon: LayoutDashboard },
    { name: "Agenda", href: "/admin/agenda", icon: Calendar },
    { name: "Meu Perfil", href: "/admin/perfil", icon: UserCircle },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Nome do Sistema */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-blue-600 tracking-tight">
              CMP
            </span>
          </div>

          {/* Navegação Principal */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-1 pt-1 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Botão de Logout */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium group"
            >
              <span className="hidden sm:inline">Sair</span>
              <LogOut
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
