import { useState } from "react";
import {
  Settings,
  Shield,
  Clock,
  Key,
  Database,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
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
import { healthApi, authApi } from "@/services/api";
import useAuthStore from "@/store/authStore";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [systemHealth, setSystemHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const { user } = useAuthStore();

  const checkSystemHealth = async () => {
    try {
      setCheckingHealth(true);
      const health = await healthApi.check();
      setSystemHealth(health);
      toast.success("Status sistem berhasil diperbarui");
    } catch (error) {
      toast.error("Gagal memeriksa status sistem");
      setSystemHealth(null);
    } finally {
      setCheckingHealth(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak sama");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    try {
      setChangingPassword(true);
      await authApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password berhasil diubah");
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Gagal mengganti password";
      toast.error(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Sistem
          </CardTitle>
          <CardDescription>
            Konfigurasi dan monitoring sistem CompanyLock Manager
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status Sistem
            </CardTitle>
            <CardDescription>
              Monitor kesehatan dan performa sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={checkSystemHealth}
              disabled={checkingHealth}
              className="w-full"
            >
              {checkingHealth ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Periksa Status Sistem
                </>
              )}
            </Button>

            {systemHealth && (
              <div className="space-y-3">
                <div className="glass-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Status Umum</span>
                    <span
                      className={`flex items-center gap-1 text-sm font-medium ${
                        systemHealth.status === "healthy"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {systemHealth.status === "healthy" ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Sehat
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          Error
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">
                      Enkripsi Database
                    </span>
                    <span
                      className={`flex items-center gap-1 text-sm font-medium ${
                        systemHealth.encryption_status === "ok"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {systemHealth.encryption_status === "ok" ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          OK
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          Error
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">
                      Waktu Pemeriksaan
                    </span>
                    <span className="text-sm font-medium text-blue-400">
                      {new Date(systemHealth.timestamp).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>Pengaturan keamanan dan akses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">
                Durasi Token Default
              </h4>
              <p className="text-sm text-white/70 mb-2">
                Durasi default untuk token akses karyawan
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="5"
                  max="60"
                  defaultValue="30"
                  className="w-20"
                  disabled
                />
                <span className="text-sm text-white/70">menit</span>
              </div>
              <p className="text-xs text-white/60 mt-1">
                Pengaturan ini akan tersedia dalam versi mendatang
              </p>
            </div>

            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">
                Durasi Tampil Password
              </h4>
              <p className="text-sm text-white/70 mb-2">
                Berapa lama password ditampilkan ke karyawan
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="10"
                  max="120"
                  defaultValue="30"
                  className="w-20"
                  disabled
                />
                <span className="text-sm text-white/70">detik</span>
              </div>
              <p className="text-xs text-white/60 mt-1">
                Saat ini tetap 30 detik untuk keamanan optimal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ganti Password Admin
          </CardTitle>
          <CardDescription>Ubah password login admin Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password Lama
              </label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Masukkan password lama"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password Baru
              </label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Masukkan password baru"
                required
                minLength="6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Konfirmasi Password Baru
              </label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Ulangi password baru"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={
                changingPassword ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword
              }
            >
              {changingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informasi Sistem
          </CardTitle>
          <CardDescription>
            Detail teknis dan konfigurasi sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">Admin Login</h4>
              <div className="text-sm space-y-1">
                <p className="text-white/80">
                  Username:{" "}
                  <span className="text-blue-400">{user?.username}</span>
                </p>
                <p className="text-white/80">
                  Nama: <span className="text-blue-400">{user?.full_name}</span>
                </p>
                <p className="text-white/80">
                  Role: <span className="text-purple-400">{user?.role}</span>
                </p>
              </div>
            </div>

            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">
                Backend Configuration
              </h4>
              <div className="text-sm space-y-1">
                <p className="text-white/80">
                  API: <span className="text-green-400">FastAPI</span>
                </p>
                <p className="text-white/80">
                  Database: <span className="text-green-400">MySQL</span>
                </p>
                <p className="text-white/80">
                  Encryption: <span className="text-green-400">AES-GCM</span>
                </p>
              </div>
            </div>

            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">
                Frontend Technology
              </h4>
              <div className="text-sm space-y-1">
                <p className="text-white/80">
                  Framework: <span className="text-cyan-400">React.js</span>
                </p>
                <p className="text-white/80">
                  Styling: <span className="text-cyan-400">Tailwind CSS</span>
                </p>
                <p className="text-white/80">
                  State: <span className="text-cyan-400">Zustand</span>
                </p>
              </div>
            </div>

            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">Security Features</h4>
              <div className="text-sm space-y-1">
                <p className="text-white/80">
                  Token: <span className="text-yellow-400">HMAC Signed</span>
                </p>
                <p className="text-white/80">
                  Audit: <span className="text-yellow-400">Full Logging</span>
                </p>
                <p className="text-white/80">
                  Password:{" "}
                  <span className="text-yellow-400">Non-copyable</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips & Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Tips Keamanan</CardTitle>
          <CardDescription>
            Praktik terbaik untuk menjaga keamanan sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">Password Admin</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Gunakan password yang kuat (min 8 karakter)</li>
                <li>• Kombinasikan huruf, angka, dan simbol</li>
                <li>• Ganti password secara berkala</li>
                <li>• Jangan bagikan ke orang lain</li>
              </ul>
            </div>

            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">Token Management</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Berikan token langsung ke karyawan</li>
                <li>• Pastikan durasi sesuai kebutuhan</li>
                <li>• Monitor penggunaan token</li>
                <li>• Periksa log aktivitas rutin</li>
              </ul>
            </div>

            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">Data Backup</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Backup database secara berkala</li>
                <li>• Simpan master key dengan aman</li>
                <li>• Test restore procedure</li>
                <li>• Dokumentasi konfigurasi sistem</li>
              </ul>
            </div>

            <div className="glass-card p-4">
              <h4 className="font-medium text-white mb-2">Monitoring</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Periksa status sistem harian</li>
                <li>• Review audit logs mingguan</li>
                <li>• Monitor aktivitas mencurigakan</li>
                <li>• Update system documentation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
