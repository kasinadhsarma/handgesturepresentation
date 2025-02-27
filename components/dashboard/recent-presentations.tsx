import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

// Mock data for recent presentations
const recentPresentations = [
  { 
    id: '1', 
    title: 'Presentation 1', 
    date: '2023-05-01',
    duration: '45 mins',
    presenter: 'John Doe'
  },
  { 
    id: '2', 
    title: 'Presentation 2', 
    date: '2023-05-05',
    duration: '30 mins',
    presenter: 'Jane Smith'
  },
  { 
    id: '3', 
    title: 'Presentation 3', 
    date: '2023-05-10',
    duration: '60 mins',
    presenter: 'Mike Johnson'
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const RecentPresentations = () => {
  return (
    <div className="mt-8">
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Presentations</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All
          </button>
        </div>
        
        <ul className="space-y-4">
          {recentPresentations.map((presentation) => (
            <li 
              key={presentation.id} 
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <a 
                href={`/presentation/${presentation.id}`}
                className="block p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {presentation.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(presentation.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {presentation.duration}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Presented by {presentation.presenter}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecentPresentations;