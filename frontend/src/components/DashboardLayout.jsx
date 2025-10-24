import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Key,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/store/authStore";
import toast from "react-hot-toast";

const sidebarItems = [
  {
    title: "Beranda",
    icon: Home,
    path: "/dashboard",
    description: "Ringkasan sistem",
  },
  {
    title: "Kelola Karyawan",
    icon: Users,
    path: "/dashboard/users",
    description: "Daftar dan import karyawan",
  },
  {
    title: "Buat Token Akses",
    icon: Key,
    path: "/dashboard/tokens",
    description: "Generate token untuk karyawan",
  },
  {
    title: "Lihat Password",
    icon: Shield,
    path: "/dashboard/password-viewer",
    description: "Interface untuk karyawan lihat password",
  },
  {
    title: "Log Aktivitas",
    icon: FileText,
    path: "/dashboard/audit-logs",
    description: "Riwayat semua aktivitas sistem",
  },
  {
    title: "Pengaturan",
    icon: Settings,
    path: "/dashboard/settings",
    description: "Konfigurasi sistem",
  },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Berhasil keluar");
    navigate("/login");
  };

  const SidebarItem = ({ item, isActive, onClick }) => {
    const Icon = item.icon;

    return (
      <button
        onClick={onClick}
        className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
          isActive
            ? "bg-white/20 border border-white/30"
            : "hover:bg-white/10 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={`h-5 w-5 ${
              isActive ? "text-white" : "text-white/70 group-hover:text-white"
            }`}
          />
          <div className="flex-1">
            <p
              className={`font-medium ${
                isActive ? "text-white" : "text-white/80 group-hover:text-white"
              }`}
            >
              {item.title}
            </p>
            <p
              className={`text-xs ${
                isActive ? "text-white/80" : "text-white/60"
              }`}
            >
              {item.description}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 glass-sidebar transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">CompanyLock</h1>
                <p className="text-sm text-white/70">Manager Panel</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-white/10">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.full_name?.charAt(0) || "A"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{user?.full_name}</p>
                  <p className="text-sm text-white/70">@{user?.username}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                isActive={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              />
            ))}
          </nav>

          {/* Logout */}
          <div className="p-6 border-t border-white/10">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay untuk mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-80">
        {/* Top Bar */}
        <div className="glass-card m-4 mb-0 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>

            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-semibold text-white">
                {sidebarItems.find((item) => item.path === location.pathname)
                  ?.title || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">
                  {user?.full_name}
                </p>
                <p className="text-xs text-white/70">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
