export type CountryData = {
  name: string;
  code: string;
  cities: string[];
};

export const LOCATIONS: CountryData[] = [
  {
    name: 'Türkiye',
    code: 'TR',
    cities: [
      'Adana', 'Adıyaman', 'Alanya', 'Ankara', 'Antalya', 'Aydın',
      'Balıkesir', 'Bodrum', 'Bursa', 'Denizli', 'Diyarbakır', 'Edirne',
      'Elazığ', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Hatay', 'İstanbul',
      'İzmir', 'Kayseri', 'Kocaeli', 'Konya', 'Malatya', 'Manisa',
      'Mardin', 'Mersin', 'Muğla', 'Samsun', 'Sakarya', 'Şanlıurfa',
      'Tekirdağ', 'Trabzon', 'Van',
    ],
  },
  {
    name: 'Almanya',
    code: 'DE',
    cities: ['Berlin', 'Bremen', 'Dortmund', 'Düsseldorf', 'Essen', 'Frankfurt', 'Hamburg', 'Köln', 'Münih', 'Stuttgart'],
  },
  {
    name: 'Avustralya',
    code: 'AU',
    cities: ['Adelaide', 'Brisbane', 'Melbourne', 'Perth', 'Sydney'],
  },
  {
    name: 'Avusturya',
    code: 'AT',
    cities: ['Graz', 'İnnsbruck', 'Linz', 'Salzburg', 'Viyana'],
  },
  {
    name: 'Belçika',
    code: 'BE',
    cities: ['Anvers', 'Brüksel', 'Gent', 'Liège'],
  },
  {
    name: 'Danimarka',
    code: 'DK',
    cities: ['Arhus', 'Kopenhag', 'Odense'],
  },
  {
    name: 'Finlandiya',
    code: 'FI',
    cities: ['Helsinki', 'Tampere', 'Turku'],
  },
  {
    name: 'Fransa',
    code: 'FR',
    cities: ['Bordeaux', 'Lille', 'Lyon', 'Marsilya', 'Nantes', 'Paris', 'Strasbourg', 'Toulouse'],
  },
  {
    name: 'Hollanda',
    code: 'NL',
    cities: ['Amsterdam', 'Eindhoven', 'Lahey', 'Rotterdam', 'Utrecht'],
  },
  {
    name: 'İngiltere',
    code: 'GB',
    cities: ['Birmingham', 'Leeds', 'Liverpool', 'Londra', 'Manchester', 'Sheffield'],
  },
  {
    name: 'İspanya',
    code: 'ES',
    cities: ['Barselona', 'Bilbao', 'Madrid', 'Sevilla', 'Valencia'],
  },
  {
    name: 'İsveç',
    code: 'SE',
    cities: ['Göteborg', 'Malmö', 'Stockholm'],
  },
  {
    name: 'İsviçre',
    code: 'CH',
    cities: ['Basel', 'Cenevre', 'Lozan', 'Zürih'],
  },
  {
    name: 'İtalya',
    code: 'IT',
    cities: ['Floransa', 'Milano', 'Naples', 'Roma', 'Torino', 'Venedik'],
  },
  {
    name: 'Japonya',
    code: 'JP',
    cities: ['Osaka', 'Tokyo', 'Yokohama'],
  },
  {
    name: 'Kanada',
    code: 'CA',
    cities: ['Calgary', 'Montreal', 'Ottawa', 'Toronto', 'Vancouver'],
  },
  {
    name: 'Kore',
    code: 'KR',
    cities: ['Busan', 'İncheon', 'Seul'],
  },
  {
    name: 'Norveç',
    code: 'NO',
    cities: ['Bergen', 'Oslo', 'Stavanger'],
  },
  {
    name: 'Portekiz',
    code: 'PT',
    cities: ['Braga', 'Lizbon', 'Porto'],
  },
  {
    name: 'Suudi Arabistan',
    code: 'SA',
    cities: ['Cidde', 'Riyad'],
  },
  {
    name: 'Türkmenistan',
    code: 'TM',
    cities: ['Aşkabat'],
  },
  {
    name: 'ABD',
    code: 'US',
    cities: ['Boston', 'Chicago', 'Dallas', 'Houston', 'Los Angeles', 'Miami', 'New York', 'San Francisco', 'Seattle', 'Washington DC'],
  },
  {
    name: 'BAE',
    code: 'AE',
    cities: ['Abu Dabi', 'Dubai', 'Sharjah'],
  },
];

export const DEFAULT_COUNTRY = 'Türkiye';

export const getCitiesForCountry = (countryName: string): string[] => {
  return LOCATIONS.find(c => c.name === countryName)?.cities ?? [];
};

export const getCountryCodeByName = (countryName: string | undefined): string => {
  if (!countryName) return 'TR';
  const country = LOCATIONS.find(c => c.name === countryName);
  return country?.code || 'TR';
};

export const ALL_COUNTRY_NAMES = LOCATIONS.map(c => c.name);
