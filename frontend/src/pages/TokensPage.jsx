import { useState, useEffect } from "react";
import {
  Key,
  Clock,
  User,
  QrCode,
  Copy,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { copyToClipboard } from "../lib/clipboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UserSelector from "@/components/ui/user-selector";
import KeyboardShortcuts from "@/components/ui/keyboard-shortcuts";
import { usersApi, tokensApi } from "@/services/api";
import toast from "react-hot-toast";

export default function TokensPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleGenerateToken = async () => {
    if (!selectedUser) {
      toast.error("Pilih karyawan terlebih dahulu");
      return;
    }

    if (duration < 5 || duration > 60) {
      toast.error("Durasi harus antara 5-60 menit");
      return;
    }

    try {
      setLoading(true);
      const result = await tokensApi.generateToken(
        parseInt(selectedUser),
        duration
      );

      setGeneratedToken({
        ...result,
        user: users.find((u) => u.id === parseInt(selectedUser)),
      });
      setShowToken(true);

      toast.success("Token berhasil dibuat!");
    } catch (error) {
      console.error("Error generating token:", error);
      const errorMessage =
        error.response?.data?.detail || "Gagal membuat token";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = (text) => {
    copyToClipboard(
      text,
      () => toast.success("Token berhasil disalin ke clipboard"),
      () => toast.error("Gagal menyalin token - silakan copy manual")
    );
  };

  const resetForm = () => {
    setSelectedUser("");
    setDuration(30);
    setGeneratedToken(null);
    setShowToken(false);
  };

  const formatExpiresAt = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Generate Token Akses
          </CardTitle>
          <CardDescription>
            Buat token akses sementara untuk karyawan melihat password mereka
          </CardDescription>
        </CardHeader>
      </Card>

      {showToken ? (
        /* Token Display */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              Token Berhasil Dibuat
            </CardTitle>
            <CardDescription>
              Token untuk {generatedToken?.user?.full_name} telah dibuat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {generatedToken?.user?.full_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {generatedToken?.user?.full_name}
                  </h3>
                  <p className="text-sm text-white/70">
                    @{generatedToken?.user?.username}
                  </p>
                  <p className="text-sm text-white/60">
                    {generatedToken?.user?.department}
                  </p>
                </div>
              </div>
            </div>

            {/* Token Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white/80">
                    Durasi
                  </span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {generatedToken?.duration_minutes} menit
                </p>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-white/80">
                    Berlaku Sampai
                  </span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {formatExpiresAt(generatedToken?.expires_at)}
                </p>
              </div>
            </div>

            {/* Token String */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Token String (Berikan ke karyawan)
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={generatedToken?.token || ""}
                  readOnly
                  className="pr-12 font-mono text-sm"
                />
                <button
                  onClick={() => handleCopyToken(generatedToken?.token)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="glass-card p-6 text-center">
              <QrCode className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 text-sm">
                QR Code akan ditampilkan di sini
                <br />
                (Fitur akan segera hadir)
              </p>
            </div>

            {/* Security Instructions */}
            <div className="glass-card p-4 border-l-4 border-yellow-400">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-400 mb-1">
                    Penting - Petunjuk Keamanan
                  </h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>
                      • Berikan token ini secara langsung kepada{" "}
                      {generatedToken?.user?.full_name}
                    </li>
                    <li>
                      • Pastikan tidak ada orang lain yang melihat token ini
                    </li>
                    <li>
                      • Token hanya berlaku selama{" "}
                      {generatedToken?.duration_minutes} menit
                    </li>
                    <li>• Token hanya bisa digunakan sekali saja</li>
                    <li>• Catat waktu pemberian token untuk referensi</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => handleCopyToken(generatedToken?.token)}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Salin Token
              </Button>

              <Button onClick={resetForm} variant="outline" className="flex-1">
                Buat Token Baru
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Token Generation Form */
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {users.length}
                  </p>
                  <p className="text-sm text-white/70">Total Karyawan</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {users.filter((u) => u.is_active).length}
                  </p>
                  <p className="text-sm text-white/70">Karyawan Aktif</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {selectedUser ? "1" : "0"}
                  </p>
                  <p className="text-sm text-white/70">Dipilih</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Pilih Karyawan
                </CardTitle>
                <CardDescription>
                  Cari dan pilih karyawan yang membutuhkan akses password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Pilih Karyawan
                  </label>
                  <UserSelector
                    users={users}
                    selectedUser={selectedUser}
                    onUserSelect={setSelectedUser}
                  />
                </div>

                {selectedUser && (
                  <div className="glass-card p-4">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Karyawan Dipilih
                    </h4>
                    {(() => {
                      const user = users.find(
                        (u) => u.id === parseInt(selectedUser)
                      );
                      return user ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {user.full_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h5 className="font-medium text-white">
                                {user.full_name}
                              </h5>
                              <p className="text-sm text-white/70">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-white/60">Departemen:</span>
                              <p className="text-white font-medium">
                                {user.department}
                              </p>
                            </div>
                            <div>
                              <span className="text-white/60">Status:</span>
                              <p className="text-green-400 font-medium">
                                ● Aktif
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Keyboard Shortcuts */}
                <KeyboardShortcuts className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atur Durasi Token</CardTitle>
                <CardDescription>
                  Tentukan berapa lama token akan berlaku
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Durasi (menit)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={duration}
                    onChange={(e) =>
                      setDuration(parseInt(e.target.value) || 30)
                    }
                    placeholder="Masukkan durasi dalam menit"
                  />
                  <p className="text-xs text-white/60 mt-1">
                    Minimal 5 menit, maksimal 60 menit
                  </p>
                </div>

                {/* Duration Presets */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Preset Durasi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 60].map((preset) => (
                      <Button
                        key={preset}
                        variant={duration === preset ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDuration(preset)}
                      >
                        {preset} mnt
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="glass-card p-4">
                  <h4 className="font-medium text-white mb-2">Preview</h4>
                  <div className="text-sm space-y-1">
                    <p className="text-white/80">
                      Token akan berlaku:{" "}
                      <span className="text-blue-400">{duration} menit</span>
                    </p>
                    <p className="text-white/80">
                      Berlaku sampai:{" "}
                      <span className="text-green-400">
                        {new Date(
                          Date.now() + duration * 60 * 1000
                        ).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateToken}
                  disabled={!selectedUser || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full"></div>
                      Membuat Token...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Generate Token
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Instructions */}
      {!showToken && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Cara Penggunaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-white mb-3">
                  Langkah untuk Admin:
                </h4>
                <ol className="text-sm text-white/70 space-y-2">
                  <li>1. Pilih karyawan yang membutuhkan akses</li>
                  <li>2. Tentukan durasi token (5-60 menit)</li>
                  <li>3. Klik "Generate Token"</li>
                  <li>4. Berikan token kepada karyawan secara aman</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium text-white mb-3">
                  Langkah untuk Karyawan:
                </h4>
                <ol className="text-sm text-white/70 space-y-2">
                  <li>1. Buka halaman "Lihat Password"</li>
                  <li>2. Pilih nama dari daftar</li>
                  <li>3. Masukkan token yang diberikan admin</li>
                  <li>4. Password akan ditampilkan sementara</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
