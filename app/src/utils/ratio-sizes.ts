export interface RatioData {
  _id: string;
  ratio: string;
  Inches: string[];
}

export interface InchData {
  _id: string;
  width: number;
  height: number;
  w: number;
  h: number;
  Slug: string;
  sell_price: number;
  actual_price: number;
}

export const fetchRatios = async (): Promise<RatioData[]> => {
  const res = await fetch(
    'https://photify.co/version-923ig/api/1.1/obj/ratios'
  );
  if (!res.ok) throw new Error('Failed to fetch ratios');
  const data = await res.json();
  return data.response?.results || [];
};

export const fetchInches = async (): Promise<InchData[]> => {
  const res = await fetch(
    'https://photify.co/version-923ig/api/1.1/obj/inches'
  );
  if (!res.ok) throw new Error('Failed to fetch inches');
  const data = await res.json();
  return data.response?.results || [];
};
