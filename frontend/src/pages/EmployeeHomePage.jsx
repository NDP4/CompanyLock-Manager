import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Key,
  Shield,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";
import { tokensApi } from "../services/api";
import { copyToClipboard } from "../lib/clipboard";
import toast from "react-hot-toast";

const EmployeeHomePage = () => {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [passwordData, setPasswordData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Silakan masukkan username Anda");
      return;
    }

    if (!token.trim()) {
      setError("Silakan masukkan token Anda");
      return;
    }

    setLoading(true);
    setError("");
    setPasswordData(null);

    try {
      const result = await tokensApi.useToken(token.trim(), username.trim());

      if (result.user && result.password) {
        setPasswordData(result);
        toast.success("Password berhasil diambil!");

        // Auto hide password setelah 30 detik untuk keamanan
        setTimeout(() => {
          setShowPassword(false);
          toast("Password disembunyikan untuk keamanan", { icon: "🔒" });
        }, 30000);
      } else {
        setError("Token tidak valid atau sudah kedaluwarsa");
      }
    } catch (err) {
      console.error("Error using token:", err);
      if (err.response?.status === 403) {
        setError("Username tidak sesuai dengan pemilik token!");
      } else if (err.response?.status === 404) {
        setError("Token tidak valid atau sudah kedaluwarsa");
      } else {
        setError(
          err.response?.data?.detail ||
            "Token tidak valid atau terjadi kesalahan"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUsername("");
    setToken("");
    setPasswordData(null);
    setShowPassword(false);
    setError("");
  };

  const handleCopyPassword = (text) => {
    copyToClipboard(
      text,
      () => toast.success("Password disalin ke clipboard!"),
      () => toast.error("Gagal menyalin password - silakan copy manual")
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
        }}
      ></div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl backdrop-blur-xl border border-white/10">
                <Shield className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">CompanyLock</h1>
            <p className="text-gray-300">
              Masukkan token untuk mengakses password Anda
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            {!passwordData ? (
              /* Authentication Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Masukkan username Anda..."
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="token"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Token Akses
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-black/20 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Masukkan token Anda..."
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !username.trim() || !token.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </div>
                  ) : (
                    "Akses Password"
                  )}
                </button>
              </form>
            ) : (
              /* Password Display */
              <div className="space-y-6">
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">
                    Token valid! Password berhasil diambil.
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <div className="p-3 bg-black/20 border border-gray-600 rounded-lg">
                      <span className="text-white font-mono">
                        {passwordData.user.username}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="p-3 bg-black/20 border border-gray-600 rounded-lg pr-20">
                        <span className="text-white font-mono">
                          {showPassword
                            ? passwordData.password
                            : "••••••••••••"}
                        </span>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title={
                            showPassword
                              ? "Sembunyikan Password"
                              : "Tampilkan Password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        {showPassword && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPassword(passwordData.password)
                            }
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Salin Password"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      <strong>Info:</strong> Nama: {passwordData.user.full_name}{" "}
                      - Departemen: {passwordData.user.department}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200"
                >
                  Gunakan Token Lain
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Butuh bantuan? Hubungi administrator IT
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Jangan berbagi token Anda dengan orang lain
            </p>
          </div>

          {/* Admin Link */}
          <div className="text-center mt-4">
            <a
              href="/admin"
              className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
            >
              Login sebagai Administrator
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHomePage;
