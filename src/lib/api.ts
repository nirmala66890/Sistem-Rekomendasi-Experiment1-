// ==============================================================================
// FULL CODE REVISI SINKRON: SRC/LIB/API.TS (EXPERIMENT 1 - PRODUCTION LIVE)
// ==============================================================================

export const BASE_URL = 'https://api.jikan.moe/v4';
// Mengarah langsung ke cloud server Hugging Face kamu yang baru
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

// Helper fungsi delay untuk mencegah Jikan API Rate Limit 429
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * HELPER: Mengambil detail satu anime secara cerdas dari Jikan.
 * Mengutamakan mal_id jika ada, atau menggunakan query title sebagai fallback.
 */
async function fetchJikanDetail(item: any): Promise<any> {
  if (item.mal_id) {
    const res = await fetch(`${BASE_URL}/anime/${item.mal_id}`);
    if (!res.ok) throw new Error(`Failed fetch Jikan ID ${item.mal_id}`);
    const json = await res.json();
    return json.data;
  } 
  
  const res = await fetch(`${BASE_URL}/anime?q=${encodeURIComponent(item.title)}&limit=1`);
  if (!res.ok) throw new Error(`Failed fetch Jikan Title ${item.title}`);
  const json = await res.json();
  if (json.data && json.data.length > 0) return json.data[0];
  
  throw new Error("Anime tidak ditemukan di Jikan");
}

/**
 * HELPER: Memproses pengayaan data gambar dari Jikan menggunakan sistem Batch (Paralel)
 * Menampilkan rekomendasi hingga top 20 item secara efisien.
 */
async function enrichAnimeDataBatch(recommendations: any[]): Promise<Anime[]> {
  const finalEnrichedAnimeList: Anime[] = [];
  const BATCH_SIZE = 3; // Mengambil 3 gambar anime sekaligus per gelombang

  for (let i = 0; i < recommendations.length; i += BATCH_SIZE) {
    const batch = recommendations.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (item) => {
      try {
        const matchedAnime = await fetchJikanDetail(item);
        
        return {
          mal_id: item.mal_id || matchedAnime.mal_id,
          title: item.title,
          score: item.score || matchedAnime.score,
          synopsis: matchedAnime.synopsis || "No synopsis available.",
          images: matchedAnime.images,
          genres: matchedAnime.genres,
          themes: matchedAnime.themes,
          recommendation_source: item.recommendation_source || "Hybrid Model",
          match_percentage: item.match_percentage,
          genre_match_score: item.genre_match_score,
          final_score: item.final_score
        } as Anime;
      } catch (e) {
        console.warn(`Fallback digunakan untuk anime: ${item.title}`, e);
        return {
          mal_id: item.mal_id || Math.floor(Math.random() * 100000),
          title: item.title,
          score: item.score || 0,
          synopsis: item.synopsis || "Metadata Match Success.",
          images: {
            jpg: {
              image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400",
              large_image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600"
            }
          },
          genres: [],
          themes: []
        } as Anime;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    finalEnrichedAnimeList.push(...batchResults);

    if (i + BATCH_SIZE < recommendations.length) {
      await delay(1000); // Jeda 1 detik antar-batch aman dari limit Jikan 429
    }
  }

  return finalEnrichedAnimeList;
}

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

/**
 * SKENARIO A: Ambil Rekomendasi Berbasis Judul Acuan (Hybrid CF + CBF)
 * Otomatis meminta top_n=20 item dari Cloud Backend Hugging Face
 */
export async function fetchRecommendationsByTitle(title: string): Promise<Anime[]> {
  try {
    const response = await fetch(`${FASTAPI_URL}/recommend/by-title?title=${encodeURIComponent(title)}&top_n=20`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) throw new Error("Gagal mengambil data dari server rekomendasi.");

    const resultData = await response.json();
    const recommendationsFromModel = resultData.recommendations || [];

    return await enrichAnimeDataBatch(recommendationsFromModel);

  } catch (error) {
    console.error("Error pada Skenario A (By Title):", error);
    return getMockAnimeList();
  }
}

/**
 * SKENARIO B: Ambil Rekomendasi Berbasis Kriteria Filter Genre Murni
 * Mengirimkan payload array genres tunggal (top_n=20) diurutkan rating tertinggi
 */
export async function fetchRecommendationsByGenreTheme(genres: string[], themes: string[] = []): Promise<Anime[]> {
  try {
    // Menggabungkan pilihan genres dan themes dari UI ke satu array karena di model baru dilebur
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

    return await enrichAnimeDataBatch(recommendationsFromModel);

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