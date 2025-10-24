import { useState, useEffect } from "react";
import {
  FileText,
  Filter,
  Calendar,
  User,
  Shield,
  Key,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auditApi } from "@/services/api";
import toast from "react-hot-toast";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterAction, dateFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditApi.getLogs(200); // Ambil 200 log terakhir
      setLogs(data.logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Gagal memuat log aktivitas");
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.details?.username
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          log.client_host?.includes(searchTerm) ||
          log.id.toString().includes(searchTerm)
      );
    }

    // Action filter
    if (filterAction !== "all") {
      filtered = filtered.filter((log) => log.action === filterAction);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          filterDate = null;
      }

      if (filterDate) {
        filtered = filtered.filter(
          (log) => new Date(log.created_at) >= filterDate
        );
      }
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (action) => {
    const icons = {
      login: User,
      logout: User,
      token_generated: Key,
      token_used: Key,
      password_viewed: Eye,
      user_imported: FileText,
      password_change: Shield,
    };
    return icons[action] || FileText;
  };

  const getActionColor = (action) => {
    const colors = {
      login: "text-green-400",
      logout: "text-yellow-400",
      token_generated: "text-blue-400",
      token_used: "text-purple-400",
      password_viewed: "text-red-400",
      user_imported: "text-cyan-400",
      password_change: "text-orange-400",
    };
    return colors[action] || "text-white/60";
  };

  const getActionDescription = (action) => {
    const descriptions = {
      login: "Masuk Sistem",
      logout: "Keluar Sistem",
      token_generated: "Token Dibuat",
      token_used: "Token Digunakan",
      password_viewed: "Password Dilihat",
      user_imported: "Import Karyawan",
      password_change: "Ganti Password",
    };
    return descriptions[action] || action;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const exportLogs = () => {
    const csvContent = [
      // Header
      [
        "ID",
        "Waktu",
        "Aksi",
        "Admin ID",
        "Target User ID",
        "IP Address",
        "Detail",
      ].join(","),
      // Data
      ...filteredLogs.map((log) =>
        [
          log.id,
          log.created_at,
          log.action,
          log.admin_id || "",
          log.target_user_id || "",
          log.client_host || "",
          JSON.stringify(log.details || {}),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Log berhasil diekspor");
  };

  const LogItem = ({ log }) => {
    const Icon = getActionIcon(log.action);
    const colorClass = getActionColor(log.action);

    return (
      <div className="glass-card p-4 hover:bg-white/15 transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full bg-white/10 ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-white">
                {getActionDescription(log.action)}
              </h3>
              <span className="text-xs text-white/60">ID: {log.id}</span>
            </div>

            <div className="text-sm text-white/70 space-y-1">
              <p>Waktu: {formatDateTime(log.created_at)}</p>
              {log.client_host && <p>IP: {log.client_host}</p>}
              {log.details && Object.keys(log.details).length > 0 && (
                <div>
                  <p>Detail:</p>
                  <div className="bg-black/20 rounded p-2 mt-1 font-mono text-xs">
                    {Object.entries(log.details).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-blue-300">{key}:</span>{" "}
                        {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Log Aktivitas
          </h1>
          <p className="text-white/70">Riwayat semua aktivitas dalam sistem</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={exportLogs}
            variant="outline"
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Ekspor CSV
          </Button>

          <Button onClick={fetchLogs} disabled={loading} variant="ghost">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{logs.length}</p>
                <p className="text-sm text-white/70">Total Log</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {
                    logs.filter((log) => {
                      const today = new Date().toISOString().split("T")[0];
                      return log.created_at?.startsWith(today);
                    }).length
                  }
                </p>
                <p className="text-sm text-white/70">Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Key className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter((log) => log.action === "token_used").length}
                </p>
                <p className="text-sm text-white/70">Token Digunakan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {
                    logs.filter((log) => log.action === "password_viewed")
                      .length
                  }
                </p>
                <p className="text-sm text-white/70">Password Dilihat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Cari berdasarkan username, IP, atau ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="glass-input"
            >
              <option value="all">Semua Aksi</option>
              <option value="login">Masuk Sistem</option>
              <option value="logout">Keluar Sistem</option>
              <option value="token_generated">Token Dibuat</option>
              <option value="token_used">Token Digunakan</option>
              <option value="password_viewed">Password Dilihat</option>
              <option value="user_imported">Import Karyawan</option>
              <option value="password_change">Ganti Password</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="glass-input"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Aktivitas</CardTitle>
          <CardDescription>
            {filteredLogs.length} dari {logs.length} aktivitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/20 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">
                {logs.length === 0
                  ? "Belum ada aktivitas yang tercatat"
                  : "Tidak ada aktivitas yang sesuai dengan filter"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLogs.map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
