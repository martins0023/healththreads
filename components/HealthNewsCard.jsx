// components/HealthNewsCard.jsx

export default function HealthNewsCard({ item, refProp }) {
    return (
      <div key={item.id} ref={refProp} className="bg-white p-4 mb-4 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-indigo-600">{item.source}</span>
          <span className="text-xs text-gray-500">
            {new Date(item.publishedAt).toLocaleString()}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">{item.title}</h3>
        <p className="mt-1 text-gray-700 text-sm line-clamp-3">{item.summary}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-indigo-600 hover:underline text-sm"
        >
          Read more
        </a>
      </div>
    )
  }
  