// ==============================================================================
// FULL CODE REVISI SINKRON: SRC/APP/COMPONENTS/HEROSEARCH.TSX 
// ==============================================================================

import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroSearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (genres: string[], themes: string[]) => void;
}

const DATASET_GENRES = [
  "Action", "Fantasy", "Comedy", "Drama", "Adventure", 
  "Romance", "Sci-Fi", "Supernatural", "Mystery", "Slice of Life", 
  "Sports", "Suspense", "Ecchi", "Horror", "Award Winning"
];

const DATASET_THEMES = [
  "School", "Adult Cast", "Isekai", "Music", "Historical", 
  "Super Power", "Military", "Mecha", "Urban Fantasy", "Mythology", 
  "Harem", "Reincarnation", "Psychological", "Parody", "Magic", 
  "CGDCT", "Female Protagonist", "Gore", "Male Protagonist", "Anthropomorphic"
];

export const HeroSearch: React.FC<HeroSearchProps> = ({ onSearch, onFilterChange }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev => prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]);
  };

  const handleApply = () => {
    // Mengirim salinan array secara aman ke komponen Home.tsx
    onFilterChange([...selectedGenres], [...selectedThemes]);
  };

  const handleReset = () => {
    setSelectedGenres([]);
    setSelectedThemes([]);
    onFilterChange([], []);
  };

  return (
    <div className="w-full py-20 px-6 relative z-50">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
           Sistem Rekomendasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Anime</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tugas Akhir Sistem Rekomendasi Anime Menggunakan Metode Hybrid Filtering.
          </p>
        </div>

        <form onSubmit={handleSearchClick} className="relative group z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
          <div className="relative flex items-center bg-[#111] border border-white/10 rounded-2xl p-2 shadow-2xl">
            <div className="pl-4 pr-2 text-gray-500"><Search size={24} /></div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime by title..."
              className="flex-1 bg-transparent border-none outline-none text-white text-lg px-2 h-14"
            />
            <button 
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 sm:px-6 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/5 mr-2 transition-colors"
            >
              <SlidersHorizontal size={18} /> <span className="hidden xs:inline">Filters</span>
            </button>
            <button type="submit" className="h-12 px-6 sm:px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity">
              Search
            </button>
          </div>
        </form>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 relative z-50"
            >
              {/* SEKSI GENRE */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Select Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {DATASET_GENRES.map(genre => (
                    <button 
                      key={genre} type="button" onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all pointer-events-auto cursor-pointer ${
                        selectedGenres.includes(genre) ? 'bg-purple-600 text-white border-transparent shadow-lg shadow-purple-600/20' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEKSI TEMA */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Select Themes</h3>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 relative z-50 pointer-events-auto custom-scrollbar">
                  {DATASET_THEMES.map(theme => (
                    <button 
                      key={theme} type="button" onClick={() => toggleTheme(theme)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all pointer-events-auto cursor-pointer ${
                        selectedThemes.includes(theme) ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 relative z-50 pointer-events-auto">
                <button type="button" onClick={handleReset} className="px-5 py-2.5 rounded-xl text-sm bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors cursor-pointer">
                  Reset
                </button>
                <button type="button" onClick={handleApply} className="px-5 py-2.5 rounded-xl text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors shadow-lg shadow-purple-600/20 cursor-pointer">
                  Apply Model Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
