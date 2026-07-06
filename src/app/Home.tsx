// ==============================================================================
// FULL CODE SINKRON: SRC/APP/HOME.TSX (SISTEM 2 - CLEAN & PRODUCTION READY)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { AnimeGrid } from './components/AnimeGrid';
import { AnimeModal } from './components/AnimeModal';

import { 
  fetchTopAnime, 
  fetchRecommendationsByTitle, 
  fetchRecommendationsByGenreTheme, 
  Anime 
} from '../lib/api';

export const Home = () => {
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [isSearchingActive, setIsSearchingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendationTitle, setRecommendationTitle] = useState<string>("Best Anime Movies");

  // memuat data ranking teratas saat pertama kali aplikasi dibuka
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const top = await fetchTopAnime();
        setTopAnime(top);
        // Mengisi rekomendasi awal dengan top 20 default
        setRecommendations(top);
      } catch (error) {
        console.error("Gagal memuat data beranda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  /**
   * SKENARIO A: Pencarian Rekomendasi Berdasarkan Judul Acuan (Hybrid Model)
   */
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearchingActive(false);
      setRecommendations(topAnime);
      setRecommendationTitle("Best Anime Movies");
      return;
    }
    
    setIsSearching(true);
    setIsSearchingActive(true);
    try {
      // Menembak endpoint /recommend lewat helper api.ts
      const modelRecommendations = await fetchRecommendationsByTitle(query);
      setRecommendations(modelRecommendations);
      setRecommendationTitle(`Recommended Based on "${query}"`);
    } catch (error) {
      console.error("Error model search:", error);
      setRecommendations([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * SKENARIO B: Penapisan Multi-Tag Bersamaan (Genre & Tema)
   */
  const handleGenreThemeFilter = async (genres: string[], themes: string[] = []) => {
    // Kebal Error: Memastikan data parameter murni berbentuk array teks bersih
    const safeGenres = Array.isArray(genres) ? genres.filter(g => typeof g === 'string' && g.trim() !== '') : [];
    const safeThemes = Array.isArray(themes) ? themes.filter(t => typeof t === 'string' && t.trim() !== '') : [];

    // Jika user mengosongkan semua pilihan centang, kembalikan tampilan ke default semula
    if (safeGenres.length === 0 && safeThemes.length === 0) {
      setIsSearchingActive(false);
      setRecommendations(topAnime);
      setRecommendationTitle("Best Anime Movies");
      return;
    }

    setIsSearching(true);
    setIsSearchingActive(true);
    try {
      // Mengirimkan array bersih ke endpoint /filter POST via helper api.ts
      const modelRecommendations = await fetchRecommendationsByGenreTheme(safeGenres, safeThemes);
      setRecommendations(modelRecommendations);
      setRecommendationTitle(`Top Results Matching Your Selected Filters`);
    } catch (error) {
      console.error("Error model filter:", error);
      setRecommendations([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white selection:bg-purple-500/30 font-sans">
      <Navbar />
      
      <main className="pb-24">
        {/* Komponen Input utama penangkap aksi user */}
        <HeroSearch onSearch={handleSearch} onFilterChange={handleGenreThemeFilter} />

        {isSearching ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : isSearchingActive ? (
          /* Merender baris tunggal hasil keluaran sistem rekomendasi cerdas kita */
          <AnimeGrid 
            title={recommendationTitle} 
            items={recommendations} 
            onItemClick={(anime) => setSelectedAnime(anime)} 
            isRecommendationSection={true}
          />
        ) : isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          /* Tampilan Default awal saat pertama kali web diakses */
          <>
            <AnimeGrid 
              title="Trending Now" 
              items={topAnime} 
              onItemClick={(anime) => setSelectedAnime(anime)} 
            />
            <div className="h-10"></div>
            <AnimeGrid 
              title="Best Anime Movies" 
              items={recommendations} 
              onItemClick={(anime) => setSelectedAnime(anime)} 
              isRecommendationSection={true}
            />
          </>
        )}
      </main>

      {/* Komponen pop-up detail ketika salah satu kartu anime diklik */}
      <AnimeModal anime={selectedAnime} onClose={() => setSelectedAnime(null)} />
    </div>
  );
};
