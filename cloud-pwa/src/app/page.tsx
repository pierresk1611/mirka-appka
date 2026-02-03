import JobQueue from '@/components/JobQueue';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              AutoDesign Cloud v3.2 (Live)
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Systém Online</span>
            </div>
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm">
              OP
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel Operátora</h2>
            <p className="text-gray-500 mt-1">Správa tlačových úloh a kontrola AI mapovania.</p>
          </div>
          <div className="hidden sm:block">
            <div className="inline-flex rounded-md shadow-sm">
              <button className="px-4 py-2 border border-blue-600 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Obnoviť zoznam
              </button>
            </div>
          </div>
        </div>

        <JobQueue />
      </div>
    </main>
  );
}
