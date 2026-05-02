import { useBookStore } from '../store/useBookStore';
import { Plus } from 'lucide-react';

export function AddButton() {
  const { openAddModal } = useBookStore();

  const handleClick = () => {
    openAddModal();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
      title="添加书籍"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
