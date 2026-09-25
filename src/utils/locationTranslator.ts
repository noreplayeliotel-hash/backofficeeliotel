import type { Language } from '../translations/translations';

/**
 * Dictionnaire complet des villes, régions et délégations de Tunisie et pays
 * en Français, Anglais, Arabe et Allemand.
 */
export const LOCATION_DICTIONARY: Record<string, Record<Language, string>> = {
    // Tunisie & Villes principales
    'djerba houmet souk': {
        fr: 'Djerba Houmet Souk',
        en: 'Djerba Houmet Souk',
        ar: 'جربة حومة السوق',
        de: 'Djerba Houmet Souk'
    },
    'houmet souk': {
        fr: 'Houmet Souk',
        en: 'Houmet Souk',
        ar: 'حومة السوق',
        de: 'Houmet Souk'
    },
    'djerba': {
        fr: 'Djerba',
        en: 'Djerba',
        ar: 'جربة',
        de: 'Djerba'
    },
    'midoun': {
        fr: 'Midoun',
        en: 'Midoun',
        ar: 'ميدون',
        de: 'Midoun'
    },
    'djerba midoun': {
        fr: 'Djerba Midoun',
        en: 'Djerba Midoun',
        ar: 'جربة ميدون',
        de: 'Djerba Midoun'
    },
    'aghir': {
        fr: 'Aghir',
        en: 'Aghir',
        ar: 'أغير',
        de: 'Aghir'
    },
    'ajim': {
        fr: 'Ajim',
        en: 'Ajim',
        ar: 'أجيم',
        de: 'Ajim'
    },
    'djerba ajim': {
        fr: 'Djerba Ajim',
        en: 'Djerba Ajim',
        ar: 'جربة أجيم',
        de: 'Djerba Ajim'
    },
    'guellala': {
        fr: 'Guellala',
        en: 'Guellala',
        ar: 'قلالة',
        de: 'Guellala'
    },
    'mellita': {
        fr: 'Mellita',
        en: 'Mellita',
        ar: 'مليتة',
        de: 'Mellita'
    },

    // Grand Tunis
    'tunis': {
        fr: 'Tunis',
        en: 'Tunis',
        ar: 'تونس',
        de: 'Tunis'
    },
    'la marsa': {
        fr: 'La Marsa',
        en: 'La Marsa',
        ar: 'المرسى',
        de: 'La Marsa'
    },
    'marsa': {
        fr: 'Marsa',
        en: 'Marsa',
        ar: 'المرسى',
        de: 'Marsa'
    },
    'sidi bou said': {
        fr: 'Sidi Bou Saïd',
        en: 'Sidi Bou Said',
        ar: 'سيدي بوسعيد',
        de: 'Sidi Bou Said'
    },
    'carthage': {
        fr: 'Carthage',
        en: 'Carthage',
        ar: 'قرطاج',
        de: 'Karthago'
    },
    'gammarth': {
        fr: 'Gammarth',
        en: 'Gammarth',
        ar: 'قمرت',
        de: 'Gammarth'
    },
    'les berges du lac': {
        fr: 'Les Berges du Lac',
        en: 'Les Berges du Lac',
        ar: 'ضفاف البحيرة',
        de: 'Les Berges du Lac'
    },
    'lac 1': {
        fr: 'Lac 1',
        en: 'Lac 1',
        ar: 'البحيرة 1',
        de: 'Lac 1'
    },
    'lac 2': {
        fr: 'Lac 2',
        en: 'Lac 2',
        ar: 'البحيرة 2',
        de: 'Lac 2'
    },
    'la goulette': {
        fr: 'La Goulette',
        en: 'La Goulette',
        ar: 'حلق الوادي',
        de: 'La Goulette'
    },
    'ariana': {
        fr: 'Ariana',
        en: 'Ariana',
        ar: 'أريانة',
        de: 'Ariana'
    },
    'ennasr': {
        fr: 'Ennasr',
        en: 'Ennasr',
        ar: 'النصر',
        de: 'Ennasr'
    },
    'el menzah': {
        fr: 'El Menzah',
        en: 'El Menzah',
        ar: 'المنزه',
        de: 'El Menzah'
    },
    'ben arous': {
        fr: 'Ben Arous',
        en: 'Ben Arous',
        ar: 'بن عروس',
        de: 'Ben Arous'
    },
    'manouba': {
        fr: 'La Manouba',
        en: 'Manouba',
        ar: 'منوبة',
        de: 'Manouba'
    },

    // Cap Bon
    'hammamet': {
        fr: 'Hammamet',
        en: 'Hammamet',
        ar: 'الحمامات',
        de: 'Hammamet'
    },
    'yasmine hammamet': {
        fr: 'Yasmine Hammamet',
        en: 'Yasmine Hammamet',
        ar: 'ياسمين الحمامات',
        de: 'Yasmine Hammamet'
    },
    'nabeul': {
        fr: 'Nabeul',
        en: 'Nabeul',
        ar: 'نابل',
        de: 'Nabeul'
    },
    'kelibia': {
        fr: 'Kélibia',
        en: 'Kelibia',
        ar: 'قليبية',
        de: 'Kelibia'
    },
    'haouaria': {
        fr: 'El Haouaria',
        en: 'Haouaria',
        ar: 'الهوارية',
        de: 'Haouaria'
    },
    'korba': {
        fr: 'Korba',
        en: 'Korba',
        ar: 'قربة',
        de: 'Korba'
    },

    // Sahel
    'sousse': {
        fr: 'Sousse',
        en: 'Sousse',
        ar: 'سوسة',
        de: 'Sousse'
    },
    'port el kantaoui': {
        fr: 'Port El Kantaoui',
        en: 'Port El Kantaoui',
        ar: 'ميناء القنطاوي',
        de: 'Port El Kantaoui'
    },
    'kantaoui': {
        fr: 'Kantaoui',
        en: 'Kantaoui',
        ar: 'القنطاوي',
        de: 'Kantaoui'
    },
    'hammam sousse': {
        fr: 'Hammam Sousse',
        en: 'Hammam Sousse',
        ar: 'حمام سوسة',
        de: 'Hammam Sousse'
    },
    'sahloul': {
        fr: 'Sahloul',
        en: 'Sahloul',
        ar: 'سهلول',
        de: 'Sahloul'
    },
    'khezama': {
        fr: 'Khezama',
        en: 'Khezama',
        ar: 'خزامة',
        de: 'Khezama'
    },
    'monastir': {
        fr: 'Monastir',
        en: 'Monastir',
        ar: 'المنستير',
        de: 'Monastir'
    },
    'skanes': {
        fr: 'Skanès',
        en: 'Skanes',
        ar: 'صقانس',
        de: 'Skanes'
    },
    'mahdia': {
        fr: 'Mahdia',
        en: 'Mahdia',
        ar: 'المهدية',
        de: 'Mahdia'
    },

    // Nord & Nord-Ouest
    'bizerte': {
        fr: 'Bizerte',
        en: 'Bizerte',
        ar: 'بنزرت',
        de: 'Bizerte'
    },
    'tabarka': {
        fr: 'Tabarka',
        en: 'Tabarka',
        ar: 'طبرقة',
        de: 'Tabarka'
    },
    'ain draham': {
        fr: 'Aïn Draham',
        en: 'Ain Draham',
        ar: 'عين دراهم',
        de: 'Ain Draham'
    },
    'beja': {
        fr: 'Béja',
        en: 'Beja',
        ar: 'باجة',
        de: 'Beja'
    },
    'jendouba': {
        fr: 'Jendouba',
        en: 'Jendouba',
        ar: 'جندوبة',
        de: 'Jendouba'
    },
    'siliana': {
        fr: 'Siliana',
        en: 'Siliana',
        ar: 'سليانة',
        de: 'Siliana'
    },
    'zaghouan': {
        fr: 'Zaghouan',
        en: 'Zaghouan',
        ar: 'زغوان',
        de: 'Zaghouan'
    },

    // Centre & Sud
    'sfax': {
        fr: 'Sfax',
        en: 'Sfax',
        ar: 'صفاقس',
        de: 'Sfax'
    },
    'kairouan': {
        fr: 'Kairouan',
        en: 'Kairouan',
        ar: 'القيروان',
        de: 'Kairouan'
    },
    'tozeur': {
        fr: 'Tozeur',
        en: 'Tozeur',
        ar: 'توزر',
        de: 'Tozeur'
    },
    'nefta': {
        fr: 'Nefta',
        en: 'Nefta',
        ar: 'نفطة',
        de: 'Nefta'
    },
    'douz': {
        fr: 'Douz',
        en: 'Douz',
        ar: 'دوز',
        de: 'Douz'
    },
    'zarzis': {
        fr: 'Zarzis',
        en: 'Zarzis',
        ar: 'جرجيس',
        de: 'Zarzis'
    },
    'gabes': {
        fr: 'Gabès',
        en: 'Gabes',
        ar: 'قابس',
        de: 'Gabes'
    },
    'medenine': {
        fr: 'Médenine',
        en: 'Medenine',
        ar: 'مدنين',
        de: 'Medenine'
    },
    'tataouine': {
        fr: 'Tataouine',
        en: 'Tataouine',
        ar: 'تطاوين',
        de: 'Tataouine'
    },
    'matmata': {
        fr: 'Matmata',
        en: 'Matmata',
        ar: 'مطماطة',
        de: 'Matmata'
    },
    'gafsa': {
        fr: 'Gafsa',
        en: 'Gafsa',
        ar: 'قفصة',
        de: 'Gafsa'
    },
    'kebili': {
        fr: 'Kébili',
        en: 'Kebili',
        ar: 'قبلي',
        de: 'Kebili'
    },
    'kasserine': {
        fr: 'Kasserine',
        en: 'Kasserine',
        ar: 'القصرين',
        de: 'Kasserine'
    },
    'sidi bouzid': {
        fr: 'Sidi Bouzid',
        en: 'Sidi Bouzid',
        ar: 'سيدي بوزيد',
        de: 'Sidi Bouzid'
    },

    // Pays
    'tunisie': {
        fr: 'Tunisie',
        en: 'Tunisia',
        ar: 'تونس',
        de: 'Tunesien'
    },
    'tunisia': {
        fr: 'Tunisie',
        en: 'Tunisia',
        ar: 'تونس',
        de: 'Tunesien'
    },
    'france': {
        fr: 'France',
        en: 'France',
        ar: 'فرنسا',
        de: 'Frankreich'
    },
    'allemagne': {
        fr: 'Allemagne',
        en: 'Germany',
        ar: 'ألمانيا',
        de: 'Deutschland'
    },
    'germany': {
        fr: 'Allemagne',
        en: 'Germany',
        ar: 'ألمانيا',
        de: 'Deutschland'
    },
    'italie': {
        fr: 'Italie',
        en: 'Italy',
        ar: 'إيطاليا',
        de: 'Italien'
    },
    'italy': {
        fr: 'Italie',
        en: 'Italy',
        ar: 'إيطاليا',
        de: 'Italien'
    },
    'espagne': {
        fr: 'Espagne',
        en: 'Spain',
        ar: 'إسبانيا',
        de: 'Spanien'
    },
    'spain': {
        fr: 'Espagne',
        en: 'Spain',
        ar: 'إسبانيا',
        de: 'Spanien'
    },
    'royaume-uni': {
        fr: 'Royaume-Uni',
        en: 'United Kingdom',
        ar: 'المملكة المتحدة',
        de: 'Vereinigtes Königreich'
    },
    'united kingdom': {
        fr: 'Royaume-Uni',
        en: 'United Kingdom',
        ar: 'المملكة المتحدة',
        de: 'Vereinigtes Königreich'
    },
    'etats-unis': {
        fr: 'États-Unis',
        en: 'United States',
        ar: 'الولايات المتحدة',
        de: 'Vereinigte Staaten'
    },
    'usa': {
        fr: 'États-Unis',
        en: 'USA',
        ar: 'الولايات المتحدة الأمريكية',
        de: 'USA'
    }
};

/**
 * Normalise un texte pour la recherche dans le dictionnaire
 */
const normalizeKey = (text: string): string => {
    return text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ');
};

// Cache mémoire local pour les résultats Google Translate
const memoryCache: Record<string, string> = {};

/**
 * Traduit de manière synchrone une ville ou région via le dictionnaire
 */
export const formatCity = (city?: string, lang: Language = 'fr'): string => {
    if (!city) return '';
    const norm = normalizeKey(city);

    // 1. Recherche directe dans le dictionnaire
    if (LOCATION_DICTIONARY[norm]?.[lang]) {
        return LOCATION_DICTIONARY[norm][lang];
    }

    // 2. Recherche dans le cache local (issu de Google Translate)
    const cacheKey = `geo_${lang}_${norm}`;
    if (memoryCache[cacheKey]) {
        return memoryCache[cacheKey];
    }
    try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
            memoryCache[cacheKey] = stored;
            return stored;
        }
    } catch {
        // Ignorer si localStorage n'est pas accessible
    }

    // 3. Décomposition par mots (ex: "Djerba Houmet Souk" si non matché en bloc)
    const words = city.split(/[\s,]+/);
    if (words.length > 1) {
        const translatedWords = words.map(w => {
            const wNorm = normalizeKey(w);
            return LOCATION_DICTIONARY[wNorm]?.[lang] || w;
        });
        const separator = lang === 'ar' ? ' ' : ' ';
        return translatedWords.join(separator);
    }

    return city;
};

/**
 * Traduit de manière synchrone un pays via le dictionnaire
 */
export const formatCountry = (country?: string, lang: Language = 'fr'): string => {
    if (!country) return '';
    const norm = normalizeKey(country);

    if (LOCATION_DICTIONARY[norm]?.[lang]) {
        return LOCATION_DICTIONARY[norm][lang];
    }

    const cacheKey = `geo_country_${lang}_${norm}`;
    if (memoryCache[cacheKey]) {
        return memoryCache[cacheKey];
    }
    try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
            memoryCache[cacheKey] = stored;
            return stored;
        }
    } catch {
        // Ignorer
    }

    return country;
};

/**
 * Formate l'adresse complète (Ville, Pays) selon la langue courante
 */
export const formatLocation = (city?: string, country?: string, lang: Language = 'fr'): string => {
    const translatedCity = formatCity(city, lang);
    const translatedCountry = formatCountry(country, lang);

    const separator = lang === 'ar' ? '، ' : ', ';

    if (translatedCity && translatedCountry) {
        return `${translatedCity}${separator}${translatedCountry}`;
    }
    return translatedCity || translatedCountry || '';
};

/**
 * Traduction automatique via Google Translate avec mise en cache
 * pour les villes inédites ou saisies librement par l'utilisateur.
 */
export const fetchGoogleTranslation = async (text: string, targetLang: Language): Promise<string> => {
    if (!text || targetLang === 'fr') return text;

    const norm = normalizeKey(text);
    if (LOCATION_DICTIONARY[norm]?.[targetLang]) {
        return LOCATION_DICTIONARY[norm][targetLang];
    }

    const cacheKey = `geo_${targetLang}_${norm}`;
    if (memoryCache[cacheKey]) {
        return memoryCache[cacheKey];
    }

    try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
            memoryCache[cacheKey] = stored;
            return stored;
        }
    } catch {
        // ...
    }

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                const translated = data[0][0][0];
                memoryCache[cacheKey] = translated;
                try {
                    localStorage.setItem(cacheKey, translated);
                } catch {
                    // ...
                }
                return translated;
            }
        }
    } catch (e) {
        console.warn('Google Translate API non joignable pour', text, e);
    }

    return text;
};
