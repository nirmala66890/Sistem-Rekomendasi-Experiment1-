// ==============================================================================
// FULL CODE SINKRON: SRC/LIB/API.TS (SISTEM 2 - CLEAN DEPLOYMENT - RAILWAY READY)
// ==============================================================================

export const BASE_URL = 'https://api.jikan.moe/v4';

// SINKRONISASI: Mengarah ke Railway Production
const FASTAPI_URL = "https://anime-be1-production.up.railway.app"; 

export interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  score: number;
  genres: { name: string }[];
  themes: { name: string }[];
  
  recommendation_source?: string;
  match_percentage?: number;
  genre_match_score?: number;
  final_score?: number;
}

/**
 * HELPER UTAMA: Memproses data langsung dari model biner bff (.joblib) ke model React UI.
 */
function mapBackendToFrontendModel(recommendations: any[]): Anime[] {
  if (!Array.isArray(recommendations)) return [];
  
  return recommendations.map((item) => {
    // Parsing genre secara aman, baik format list object maupun string mentah
    let formattedGenres: { name: string }[] = [];
    
    if (item.genres) {
      if (Array.isArray(item.genres)) {
        formattedGenres = item.genres.map((g: any) => {
          if (typeof g === 'object' && g !== null && g.name) {
            return { name: String(g.name).trim() };
          }
          return { name: String(g).trim() };
        }).filter((g) => g.name !== "");
      } else if (typeof item.genres === 'string') {
        try {
          formattedGenres = item.genres
            .replace(/[\[\]']/g, '')
            .split(',')
            .map((g: string) => ({ name: g.trim() }))
            .filter((g: any) => g.name !== "");
        } catch (e) {
          formattedGenres = [];
        }
      }
    }

    // Gambar langsung dibaca dari kolom database model tanpa pencarian gabungan lagi
    const directImageUrl = item.image_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400";

    return {
      mal_id: Number(item.mal_id) || 0,
      title: item.title || "Unknown Title",
      score: item.score || 0,
      synopsis: item.synopsis || "No synopsis available.",
      images: {
        jpg: {
          image_url: directImageUrl,
          large_image_url: directImageUrl
        }
      },
      genres: formattedGenres,
      themes: [], // Sesuai data model backend
      recommendation_source: item.recommendation_source || "Hybrid Model",
      match_percentage: item.match_percentage,
      genre_match_score: item.genre_match_score,
      final_score: item.final_score
    } as Anime;
  });
}

// ==============================================================================
// KODE PENYELAMAT COMPATIBILITY
// ==============================================================================
export async function enrichAnimeDataBatch(recommendations: any[]): Promise<Anime[]> {
  return mapBackendToFrontendModel(recommendations);
}

export async function fetchJikanDetail(item: any): Promise<any> {
  return item;
}
// ==============================================================================

export async function fetchTopAnime(): Promise<Anime[]> {
  try {
    const res = await fetch(`${BASE_URL}/top/anime?limit=20`);
    if (!res.ok) throw new Error('Failed to fetch top anime');
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

export async function searchAnime(query: string): Promise<Anime[]> {
  try {
    const res = await fetch(`${BASE_URL}/anime?q=${query}&limit=12`);
    if (!res.ok) throw new Error('Failed to fetch search result');
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}

export async function fetchRecommendationsByTitle(title: string): Promise<Anime[]> {
  try {
    const response = await fetch(`${FASTAPI_URL}/recommend?title=${encodeURIComponent(title)}&top_n=20`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) throw new Error("Gagal mengambil data dari server rekomendasi.");

    const resultData = await response.json();
    const recommendationsFromModel = resultData.data || [];

    if (recommendationsFromModel.length === 0) {
      return await fetchTopAnime();
    }

    return mapBackendToFrontendModel(recommendationsFromModel);

  } catch (error) {
    console.error("Error pada Skenario A (By Title):", error);
    return await fetchTopAnime();
  }
}

export async function fetchRecommendationsByGenreTheme(genres: string[], themes: string[] = []): Promise<Anime[]> {
  try {
    const response = await fetch(`${FASTAPI_URL}/filter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        genres: genres,
        themes: themes,
        tags: [],
        top_n: 20
      })
    });

    if (!response.ok) throw new Error("Gagal mengambil data filter dari server rekomendasi.");

    const resultData = await response.json();
    const recommendationsFromModel = resultData.data || [];

    if (recommendationsFromModel.length === 0) {
      console.warn("Model mengembalikan hasil kosong. Mengaktifkan Fallback Jikan Top Anime.");
      return await fetchTopAnime();
    }

    return mapBackendToFrontendModel(recommendationsFromModel);

  } catch (error) {
    console.error("Error pada Skenario B (By Genre):", error);
    return await fetchTopAnime();
  }
}
