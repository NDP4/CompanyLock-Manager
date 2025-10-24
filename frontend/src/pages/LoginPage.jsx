import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/api";
import useAuthStore from "@/store/authStore";
import toast from "react-hot-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username harus diisi"),
  password: z.string().min(1, "Password harus diisi"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama harus diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password baru dan konfirmasi tidak sama",
    path: ["confirmPassword"],
  });

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { login, updatePassword } = useAuthStore();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const changePasswordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (data) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data.username, data.password);

      login(response.user, response.access_token);

      if (response.user.must_change_password) {
        setShowChangePassword(true);
        toast.success("Login berhasil! Silakan ganti password default Anda.");
      } else {
        toast.success("Login berhasil!");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Login gagal";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (data) => {
    setIsLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);

      updatePassword();
      setShowChangePassword(false);
      toast.success("Password berhasil diubah!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Gagal mengganti password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (showChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Lock className="h-6 w-6" />
                Ganti Password
              </CardTitle>
              <CardDescription>
                Untuk keamanan, Anda harus mengganti password default
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={changePasswordForm.handleSubmit(handleChangePassword)}
                className="space-y-4"
              >
                <div>
                  <Input
                    type="password"
                    placeholder="Password lama"
                    {...changePasswordForm.register("currentPassword")}
                  />
                  {changePasswordForm.formState.errors.currentPassword && (
                    <p className="text-red-400 text-sm mt-1">
                      {
                        changePasswordForm.formState.errors.currentPassword
                          .message
                      }
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder="Password baru"
                    {...changePasswordForm.register("newPassword")}
                  />
                  {changePasswordForm.formState.errors.newPassword && (
                    <p className="text-red-400 text-sm mt-1">
                      {changePasswordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder="Konfirmasi password baru"
                    {...changePasswordForm.register("confirmPassword")}
                  />
                  {changePasswordForm.formState.errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">
                      {
                        changePasswordForm.formState.errors.confirmPassword
                          .message
                      }
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Ganti Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2">
              CompanyLock Manager
            </CardTitle>
            <CardDescription>
              Masuk ke panel admin untuk mengelola akses password karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    type="text"
                    placeholder="Username"
                    className="pl-10"
                    {...loginForm.register("username")}
                  />
                </div>
                {loginForm.formState.errors.username && (
                  <p className="text-red-400 text-sm mt-1">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="pl-10 pr-10"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-400 text-sm mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Masuk..." : "Masuk"}
              </Button>
            </form>

            <div className="mt-6 p-4 glass rounded-lg">
              <p className="text-xs text-white/70 text-center">
                <strong>Login Default:</strong>
                <br />
                Username: admin
                <br />
                Password: admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
