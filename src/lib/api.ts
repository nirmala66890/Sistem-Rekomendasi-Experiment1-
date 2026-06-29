// ==============================================================================
// FULL CODE REVISI SINKRON: SRC/LIB/API.TS (COMPATIBILITY MODE FOR NETLIFY BUILD)
// ==============================================================================

export const BASE_URL = 'https://api.jikan.moe/v4';
const FASTAPI_URL = "https://jikojeromi77-be-experiment2.hf.space";

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
 * HELPER UTAMA: Memproses konversi format data dari Backend FastAPI langsung ke standar UI React.
 */
function mapBackendToFrontendModel(recommendations: any[]): Anime[] {
  return recommendations.map((item) => {
    let formattedGenres: { name: string }[] = [];
    if (item.genres) {
      try {
        const cleanGenres = item.genres.replace(/[\[\]']/g, '').split(',');
        formattedGenres = cleanGenres
          .map((g: string) => ({ name: g.trim() }))
          .filter((g: any) => g.name !== "");
      } catch (e) {
        formattedGenres = [];
      }
    }

    const directImageUrl = item.image_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400";

    return {
      mal_id: item.mal_id,
      title: item.title,
      score: item.score,
      synopsis: item.synopsis || "No synopsis available.",
      images: {
        jpg: {
          image_url: directImageUrl,
          large_image_url: directImageUrl
        }
      },
      genres: formattedGenres,
      themes: [],
      recommendation_source: item.recommendation_source || "Hybrid Model",
      match_percentage: item.match_percentage,
      genre_match_score: item.genre_match_score,
      final_score: item.final_score
    } as Anime;
  });
}

// ==============================================================================
// KODE PENYELAMAT: Fungsi tiruan agar komponen React lama tidak eror saat di-build
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
    const res = await fetch(`${BASE_URL}/top/anime?limit=15`);
    if (!res.ok) throw new Error('Failed to fetch top anime');
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    return getMockAnimeList();
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
    const response = await fetch(`${FASTAPI_URL}/recommend/by-title?title=${encodeURIComponent(title)}&top_n=20`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) throw new Error("Gagal mengambil data dari server rekomendasi.");

    const resultData = await response.json();
    const recommendationsFromModel = resultData.recommendations || [];

    return mapBackendToFrontendModel(recommendationsFromModel);

  } catch (error) {
    console.error("Error pada Skenario A (By Title):", error);
    return getMockAnimeList();
  }
}

export async function fetchRecommendationsByGenreTheme(genres: string[], themes: string[] = []): Promise<Anime[]> {
  try {
    const combinedGenres = [...genres, ...themes];

    const response = await fetch(`${FASTAPI_URL}/recommend/by-genre?top_n=20`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ genres: combinedGenres })
    });

    if (!response.ok) throw new Error("Gagal mengambil data filter dari server rekomendasi.");

    const resultData = await response.json();
    const recommendationsFromModel = resultData.recommendations || [];

    return mapBackendToFrontendModel(recommendationsFromModel);

  } catch (error) {
    console.error("Error pada Skenario B (By Genre):", error);
    return getMockAnimeList();
  }
}

function getMockAnimeList(): Anime[] {
  return [
    {
      mal_id: 11061,
      title: "Hunter x Hunter (2011)",
      images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1337/138687l.jpg", large_image_url: "https://cdn.myanimelist.net/images/anime/1337/138687l.jpg" } },
      synopsis: "An elegant adaptation of the iconic shounen manga following Gon and Killua.",
      score: 9.04,
      genres: [{ name: "Action" }, { name: "Adventure" }, { name: "Fantasy" }],
      themes: []
    }
  ];
}
