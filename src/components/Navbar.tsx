import { useAuthStore } from '../store/useAuthStore';
import { BookOpen, User, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#007aff] rounded-lg flex items-center justify-center shadow-sm">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-[#1d1d1f]">
            书历
          </h1>
          <p className="text-[11px] text-[#6e6e73]">ShuLi · Timeline</p>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f7] rounded-lg">
          <div className="w-7 h-7 bg-[#007aff] rounded-full flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-[#1d1d1f]">{user?.name}</span>
        </div>
        
        <button
          onClick={logout}
          className="p-2 hover:bg-[#f5f5f7] rounded-lg transition-colors"
          title="退出登录"
        >
          <LogOut className="w-5 h-5 text-[#6e6e73]" />
        </button>
      </div>
    </nav>
  );
}
