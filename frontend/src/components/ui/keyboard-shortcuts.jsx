import { Keyboard, Search, MousePointer } from "lucide-react";

const KeyboardShortcuts = ({ className = "" }) => {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="h-4 w-4 text-blue-400" />
        <h4 className="font-medium text-white text-sm">Cara Penggunaan</h4>
      </div>
      <div className="space-y-2 text-xs text-white/70">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Search className="h-3 w-3" />
            Cari karyawan
          </span>
          <kbd className="px-2 py-1 bg-white/10 rounded text-white/80">
            Ketik di kotak pencarian
          </kbd>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <MousePointer className="h-3 w-3" />
            Pilih karyawan
          </span>
          <kbd className="px-2 py-1 bg-white/10 rounded text-white/80">
            Klik kartu karyawan
          </kbd>
        </div>
        <div className="flex justify-between items-center">
          <span>Hapus pilihan</span>
          <kbd className="px-2 py-1 bg-white/10 rounded text-white/80">
            Tombol "Hapus"
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
