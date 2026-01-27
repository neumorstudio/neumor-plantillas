export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Sitio no encontrado
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          El sitio web que buscas no existe o ha sido desactivado.
          Verifica que la URL sea correcta.
        </p>
        <a
          href="https://neumorstudio.com"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Ir a NeumorStudio
        </a>
      </div>
    </main>
  );
}
