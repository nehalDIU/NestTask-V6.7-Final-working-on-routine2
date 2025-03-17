import { useState } from 'react';
import { SearchBar } from '../components/search/SearchBar';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types';

interface SearchPageProps {
  tasks: Task[];
}

export function SearchPage({ tasks }: SearchPageProps) {
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const results = tasks.filter(task => 
      task.name.toLowerCase().includes(normalizedQuery) ||
      task.description.toLowerCase().includes(normalizedQuery) ||
      task.category.toLowerCase().includes(normalizedQuery)
    );

    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Tasks</h1>
      
      <SearchBar onSearch={handleSearch} />
      
      {hasSearched ? (
        searchResults.length > 0 ? (
          <TaskList tasks={searchResults} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No tasks found matching your search
          </div>
        )
      ) : (
        <div className="text-center py-8 text-gray-500">
          Enter a search term to find tasks
        </div>
      )}
    </div>
  );
}