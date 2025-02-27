export type ImageURI = string;

export type Review = {
  id: number;
  text: string;
  rating: number;
  author: string;
  date: string;
  likes: number;
  isLiked?: boolean;
};

export type Liquor = {
  id: number;
  name: string;
  type: string;
  rating: number;
  description?: string;
  image?: ImageURI;
  price?: {
    average: number;
    min: number;
    max: number;
  };
  details?: {
    alcohol: string;
    volume: string;
    manufacturer: string;
    origin: string;
  };
  profile?: {
    smoothness: number;
    aroma: number;
    complexity: number;
    finish: number;
    balance: number;
    intensity: number;
  };
  reviews?: Review[];
}; 