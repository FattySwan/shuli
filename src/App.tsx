import { Navbar } from './components/Navbar';
import { TimelineMatrix } from './components/TimelineMatrix';
import { AddButton } from './components/AddButton';
import { BookFormModal } from './components/BookFormModal';

function App() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <TimelineMatrix />
      </main>
      <AddButton />
      <BookFormModal />
    </div>
  );
}

export default App;
