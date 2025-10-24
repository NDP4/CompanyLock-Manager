import { useState, useEffect } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Key,
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
import { usersApi, tokensApi } from "@/services/api";
import toast from "react-hot-toast";

export default function PasswordViewerPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let interval;
    if (showPassword && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowPassword(false);
            setPasswordData(null);
            toast("Waktu tampil password telah habis", {
              icon: "⏰",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showPassword, timeLeft]);

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getUsers();
      // Filter hanya user biasa (bukan admin) yang aktif
      const regularUsers = data.users.filter(
        (user) => user.role === "User" && user.is_active
      );
      setUsers(regularUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data karyawan");
    }
  };

  const handleViewPassword = async () => {
    if (!selectedUser) {
      toast.error("Pilih nama Anda terlebih dahulu");
      return;
    }

    if (!token.trim()) {
      toast.error("Masukkan token yang diberikan oleh admin");
      return;
    }

    try {
      setLoading(true);
      const result = await tokensApi.useToken(token.trim());

      // Verifikasi user yang dipilih sama dengan token
      if (result.user.id !== parseInt(selectedUser)) {
        toast.error("Token tidak sesuai dengan nama yang dipilih");
        return;
      }

      setPasswordData(result);
      setShowPassword(true);
      setTimeLeft(30); // 30 detik untuk melihat password

      toast.success("Password berhasil ditampilkan");
    } catch (error) {
      console.error("Error using token:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Token tidak valid atau sudah kadaluwarsa";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser("");
    setToken("");
    setPasswordData(null);
    setShowPassword(false);
    setTimeLeft(0);
  };

  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Lihat Password Anda
          </CardTitle>
          <CardDescription>
            Gunakan token yang diberikan oleh admin untuk melihat password Anda
          </CardDescription>
        </CardHeader>
      </Card>

      {showPassword ? (
        /* Password Display */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              Password Anda
            </CardTitle>
            <CardDescription>
              Harap catat atau ingat password berikut dengan baik
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timer */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-mono text-lg">
                  {formatTimeLeft(timeLeft)}
                </span>
                <span className="text-white/70 text-sm">tersisa</span>
              </div>
            </div>

            {/* User Info */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {passwordData?.user?.full_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {passwordData?.user?.full_name}
                  </h3>
                  <p className="text-sm text-white/70">
                    @{passwordData?.user?.username}
                  </p>
                  <p className="text-sm text-white/60">
                    {passwordData?.user?.department}
                  </p>
                </div>
              </div>
            </div>

            {/* Password Display */}
            <div className="glass-card p-6 text-center border-2 border-green-400/30">
              <div className="mb-4">
                <Lock className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-white">
                  Password Anda
                </h3>
              </div>

              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <p className="text-3xl font-mono text-green-400 non-copyable select-none tracking-wider">
                  {passwordData?.password}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                <AlertTriangle className="h-4 w-4" />
                <span>Password tidak dapat disalin untuk keamanan</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="glass-card p-4 border-l-4 border-red-400">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-400 mb-1">
                    Penting - Petunjuk Keamanan
                  </h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• Catat atau ingat password ini dengan baik</li>
                    <li>• Jangan biarkan orang lain melihat password Anda</li>
                    <li>
                      • Password akan hilang setelah {formatTimeLeft(timeLeft)}
                    </li>
                    <li>• Segera tutup halaman ini setelah selesai</li>
                    <li>• Jika lupa, hubungi admin IT untuk token baru</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="text-center pt-4">
              <Button onClick={resetForm} variant="outline" size="lg">
                Selesai & Tutup
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Token Input Form */
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Masukkan Informasi</CardTitle>
              <CardDescription>
                Pilih nama Anda dan masukkan token dari admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Pilih Nama Anda
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="glass-input w-full"
                >
                  <option value="">Pilih nama Anda dari daftar...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} - {user.department}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-white/60 mt-1">
                  Nama Anda tidak ada? Hubungi admin untuk mendaftarkan akun
                </p>
              </div>

              {/* Token Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Key className="inline h-4 w-4 mr-1" />
                  Token Akses
                </label>
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Masukkan token yang diberikan oleh admin"
                  className="font-mono"
                />
                <p className="text-xs text-white/60 mt-1">
                  Token berupa kombinasi huruf dan angka yang diberikan oleh
                  admin IT
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleViewPassword}
                disabled={!selectedUser || !token.trim() || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full"></div>
                    Memverifikasi Token...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Password Saya
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>📋 Cara Menggunakan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-2">
                    Langkah-langkah:
                  </h4>
                  <ol className="text-sm text-white/70 space-y-1">
                    <li>1. Pilih nama Anda dari daftar dropdown</li>
                    <li>2. Masukkan token yang diberikan oleh admin IT</li>
                    <li>3. Klik "Lihat Password Saya"</li>
                    <li>
                      4. Catat password yang muncul (hanya tampil 30 detik)
                    </li>
                    <li>
                      5. Gunakan password tersebut untuk login ke komputer
                    </li>
                  </ol>
                </div>

                <div className="glass-card p-4 border-l-4 border-blue-400">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-400 mb-1">
                        Keamanan & Privasi
                      </h4>
                      <ul className="text-sm text-white/70 space-y-1">
                        <li>• Token hanya bisa digunakan sekali</li>
                        <li>• Password hanya ditampilkan selama 30 detik</li>
                        <li>• Password tidak bisa disalin untuk keamanan</li>
                        <li>• Semua aktivitas tercatat untuk audit</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
