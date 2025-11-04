import { SettingsBar } from './components/SettingsBar';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="max-w-3xl mx-auto p-4">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">JP Drills</h1>
          <SettingsBar />
        </header>
        <div className="rounded-xl border p-6">
          <p className="text-lg">We’ll plug the practice card in next.</p>
        </div>
      </div>
    </div>
  );
}
