export interface ApiError {
  error: string;
  status: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TmdbConfig {
  id: number;
  apiKey: string;
  baseUrl: string;
  imageBaseUrl: string;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovieData {
  id: number;
  title: string;
  originalTitle?: string;
  description?: string;
  year?: number;
  rating?: number;
  duration?: number;
  poster?: string;
  backdrop?: string;
  trailer?: string;
  releaseDate?: string;
  isActive: boolean;
  isFeatured: boolean;
  genres: Array<{
    id: number;
    name: string;
  }>;
  category?: {
    id: number;
    name: string;
  } | null;
}

export interface SeriesData {
  id: number;
  title: string;
  originalTitle?: string;
  description?: string;
  year?: number;
  rating?: number;
  poster?: string;
  backdrop?: string;
  trailer?: string;
  firstAirDate?: string;
  lastAirDate?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: string;
  isActive: boolean;
  isFeatured: boolean;
  genres: Array<{
    id: number;
    name: string;
  }>;
  category?: {
    id: number;
    name: string;
  } | null;
}
