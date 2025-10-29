import React, { useState } from "react";
import { User, Search, Users, Building } from "lucide-react";
import { Input } from "./input";

const UserSelector = ({
  users = [],
  selectedUser,
  onUserSelect,
  placeholder = "Pilih karyawan...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected user data
  const selectedUserData = users.find(
    (user) => user.id.toString() === selectedUser
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
        <Input
          type="text"
          placeholder="Cari nama karyawan, username, atau departemen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected User Display */}
      {selectedUserData && (
        <div className="glass-card p-4 bg-blue-500/10 border-2 border-blue-500/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-lg">
                {selectedUserData.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg">
                {selectedUserData.full_name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-white/70 mt-1">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />@{selectedUserData.username}
                </span>
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {selectedUserData.department}
                </span>
              </div>
            </div>
            <button
              onClick={() => onUserSelect("")}
              className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-lg hover:bg-red-400/10 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserSelect(user.id.toString())}
              className={`glass-card p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                selectedUser === user.id.toString()
                  ? "bg-blue-500/20 border-2 border-blue-400/70 shadow-lg"
                  : "hover:bg-white/10 border-2 border-white/20 hover:border-white/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <span className="text-white font-medium">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{user.full_name}</h4>
                  <div className="flex items-center gap-4 text-sm text-white/70 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />@{user.username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {user.department}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center">
            <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">
              {searchTerm
                ? `Tidak ada karyawan yang sesuai dengan "${searchTerm}"`
                : "Tidak ada karyawan yang tersedia"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-400 text-sm mt-2 hover:underline"
              >
                Hapus pencarian
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSelector;
