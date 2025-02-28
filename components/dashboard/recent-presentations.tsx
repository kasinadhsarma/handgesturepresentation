'use client'

interface Presentation {
  id: string
  title: string
  last_viewed: string
  total_slides: number
  annotations_count: number
}

interface RecentPresentationsProps {
  presentations: Presentation[]
}

export function RecentPresentations({ presentations }: RecentPresentationsProps) {
  return (
    <div className="space-y-4">
      {presentations.map(presentation => (
        <div 
          key={presentation.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {presentation.title}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(presentation.last_viewed).toLocaleDateString()} • {presentation.total_slides} slides
            </p>
          </div>
          <div className="ml-4 flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {presentation.annotations_count} annotations
            </div>
            <button
              onClick={() => window.location.href = `/presentation/${presentation.id}`}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              View
            </button>
          </div>
        </div>
      ))}

      {presentations.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500">No presentations yet</p>
        </div>
      )}
    </div>
  )
}
