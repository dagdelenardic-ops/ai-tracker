import { Loader2 } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
      <p className="text-gray-400">AI araçları yükleniyor...</p>
    </div>
  );
}
