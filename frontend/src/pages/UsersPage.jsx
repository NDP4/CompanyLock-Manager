import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Download,
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Key,
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
import { usersApi, csvApi } from "@/services/api";
import toast from "react-hot-toast";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getUsers();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data karyawan");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((user) =>
        filterStatus === "active" ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(filtered);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await csvApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_karyawan.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Template berhasil diunduh");
    } catch (error) {
      toast.error("Gagal mengunduh template");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Hanya file CSV yang diperbolehkan");
      return;
    }

    try {
      setLoading(true);
      const result = await csvApi.importUsers(file);

      toast.success(
        `Import berhasil! ${result.imported_count} karyawan baru, ${result.updated_count} diperbarui`
      );

      if (result.errors && result.errors.length > 0) {
        console.warn("Import warnings:", result.errors);
        toast(
          "Ada beberapa peringatan saat import. Periksa console untuk detail.",
          {
            duration: 5000,
            icon: "⚠️",
          }
        );
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh data
      await fetchUsers();
    } catch (error) {
      console.error("Error importing users:", error);
      const errorMessage = error.response?.data?.detail || "Gagal import data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const UserCard = ({ user }) => {
    return (
      <div className="glass-card p-4 hover:bg-white/15 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                user.role === "Admin"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500"
              }`}
            >
              {user.full_name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-white">{user.full_name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    user.role === "Admin"
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    user.is_active
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {user.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <p className="text-sm text-white/70">@{user.username}</p>
              <p className="text-sm text-white/60">{user.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // TODO: Implement view user details
                toast("Fitur detail karyawan akan segera hadir");
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {user.role === "User" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  // TODO: Navigate to token generation for this user
                  toast("Akan diarahkan ke halaman generate token");
                }}
              >
                <Key className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleDownloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Unduh Template CSV
          </Button>

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>

        <Button onClick={fetchUsers} disabled={loading} variant="ghost">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-white/70">Total Karyawan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 font-bold">✓</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.is_active).length}
                </p>
                <p className="text-sm text-white/70">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 font-bold">A</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.role === "Admin").length}
                </p>
                <p className="text-sm text-white/70">Admin</p>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  type="text"
                  placeholder="Cari nama, username, atau departemen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="glass-input"
            >
              <option value="all">Semua Role</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-input"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Karyawan
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} dari {users.length} karyawan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/20 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">
                {users.length === 0
                  ? "Belum ada karyawan. Import data CSV untuk memulai."
                  : "Tidak ada karyawan yang sesuai dengan filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
