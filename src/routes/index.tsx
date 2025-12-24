import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/utils/routeProtection'

export const Route = createFileRoute('/')({
  beforeLoad: requireAuth,
  component: App,
})

function App() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to Punypage
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-300">
          A powerful document management system with AI-powered search and editing capabilities.
        </p>

        <div className="space-y-4 text-gray-700 dark:text-gray-400">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Features:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Organize documents with hierarchical folder structure</li>
              <li>Semantic search powered by RAG (Retrieval-Augmented Generation)</li>
              <li>Rich text editing with markdown support</li>
              <li>AI chat assistant for document insights</li>
            </ul>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Get started by browsing your documents in the sidebar or use the search page to find what you need.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
