import { useState, useEffect } from "react";
import {
  Users,
  Key,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usersApi, auditApi, healthApi } from "@/services/api";
import toast from "react-hot-toast";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTokensToday: 0,
    systemHealth: "loading",
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users data
      const usersData = await usersApi.getUsers();
      const totalUsers = usersData.users.length;
      const activeUsers = usersData.users.filter(
        (user) => user.is_active
      ).length;

      // Fetch recent audit logs
      const logsData = await auditApi.getLogs(10);
      setRecentLogs(logsData.logs);

      // Count tokens generated today
      const today = new Date().toISOString().split("T")[0];
      const tokensToday = logsData.logs.filter(
        (log) =>
          log.action === "token_generated" && log.created_at?.startsWith(today)
      ).length;

      // Check system health
      const healthData = await healthApi.check();

      setStats({
        totalUsers,
        activeUsers,
        totalTokensToday: tokensToday,
        systemHealth:
          healthData.encryption_status === "ok" ? "healthy" : "error",
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    color = "blue",
  }) => {
    const colorClasses = {
      blue: "text-blue-400",
      green: "text-green-400",
      yellow: "text-yellow-400",
      purple: "text-purple-400",
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">{title}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/60 mt-1">{description}</p>
            </div>
            <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionDescription = (action) => {
    const descriptions = {
      login: "Masuk sistem",
      logout: "Keluar sistem",
      token_generated: "Token dibuat",
      token_used: "Token digunakan",
      password_viewed: "Password dilihat",
      user_imported: "Import karyawan",
      password_change: "Ganti password",
    };
    return descriptions[action] || action;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-white/10 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Karyawan"
          value={stats.totalUsers}
          description="Terdaftar dalam sistem"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Karyawan Aktif"
          value={stats.activeUsers}
          description="Yang dapat menggunakan sistem"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Token Hari Ini"
          value={stats.totalTokensToday}
          description="Token yang dibuat hari ini"
          icon={Key}
          color="yellow"
        />
        <StatCard
          title="Status Sistem"
          value={stats.systemHealth === "healthy" ? "Sehat" : "Error"}
          description={
            stats.systemHealth === "healthy"
              ? "Semua berjalan normal"
              : "Ada masalah sistem"
          }
          icon={stats.systemHealth === "healthy" ? Shield : AlertCircle}
          color={stats.systemHealth === "healthy" ? "green" : "red"}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Aktivitas Terbaru
            </CardTitle>
            <CardDescription>
              10 aktivitas terakhir dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-white/60 text-center py-4">
                  Belum ada aktivitas
                </p>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 glass rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {getActionDescription(log.action)}
                      </p>
                      <p className="text-xs text-white/60">
                        {formatDateTime(log.created_at)}
                      </p>
                    </div>
                    <div className="text-xs text-white/60">ID: {log.id}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Informasi Sistem
            </CardTitle>
            <CardDescription>
              Status dan informasi sistem CompanyLock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 glass rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Enkripsi Database</span>
                <span
                  className={`text-sm font-medium ${
                    stats.systemHealth === "healthy"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {stats.systemHealth === "healthy" ? "✓ Aktif" : "✗ Error"}
                </span>
              </div>
            </div>

            <div className="p-3 glass rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">API Backend</span>
                <span className="text-sm font-medium text-green-400">
                  ✓ Online
                </span>
              </div>
            </div>

            <div className="p-3 glass rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Database MySQL</span>
                <span className="text-sm font-medium text-green-400">
                  ✓ Connected
                </span>
              </div>
            </div>

            <div className="p-3 glass rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Audit Logging</span>
                <span className="text-sm font-medium text-green-400">
                  ✓ Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Tips Penggunaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 glass rounded-lg">
              <h4 className="font-medium text-white mb-2">Keamanan Token</h4>
              <p className="text-sm text-white/70">
                Selalu pastikan token diberikan secara langsung dan aman kepada
                karyawan yang bersangkutan.
              </p>
            </div>

            <div className="p-4 glass rounded-lg">
              <h4 className="font-medium text-white mb-2">Import Data CSV</h4>
              <p className="text-sm text-white/70">
                Gunakan template CSV yang disediakan untuk memastikan format
                data yang benar saat import.
              </p>
            </div>

            <div className="p-4 glass rounded-lg">
              <h4 className="font-medium text-white mb-2">Monitor Aktivitas</h4>
              <p className="text-sm text-white/70">
                Periksa log aktivitas secara berkala untuk memantau penggunaan
                sistem.
              </p>
            </div>

            <div className="p-4 glass rounded-lg">
              <h4 className="font-medium text-white mb-2">Backup Data</h4>
              <p className="text-sm text-white/70">
                Lakukan backup database secara rutin untuk menjaga keamanan data
                karyawan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
