import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../translations/translations';
import { LANGUAGES, translations, AMENITY_TRANSLATIONS } from '../translations/translations';
import {
    formatCity as formatCityHelper,
    formatCountry as formatCountryHelper,
    formatLocation as formatLocationHelper
} from '../utils/locationTranslator';

interface LanguageContextType {
    currentLang: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    getAmenityLabel: (amenity: string) => string;
    formatPropertyType: (type?: string) => string;
    formatRoomType: (type?: string) => string;
    formatCity: (city?: string) => string;
    formatCountry: (country?: string) => string;
    formatLocation: (city?: string, country?: string) => string;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentLang, setCurrentLangState] = useState<Language>(() => {
        try {
            const saved = localStorage.getItem('eliotel_lang') as Language;
            if (saved && (saved === 'fr' || saved === 'en' || saved === 'ar' || saved === 'de')) {
                return saved;
            }
        } catch {
            // fallback
        }
        return 'fr';
    });

    const isRTL = currentLang === 'ar';

    const setLanguage = (lang: Language) => {
        setCurrentLangState(lang);
        try {
            localStorage.setItem('eliotel_lang', lang);
        } catch (e) {
            console.error('Erreur sauvegarde langue:', e);
        }
    };

    useEffect(() => {
        document.documentElement.lang = currentLang;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        if (isRTL) {
            document.body.classList.add('rtl-layout');
        } else {
            document.body.classList.remove('rtl-layout');
        }
    }, [currentLang, isRTL]);

    const t = (key: string, params?: Record<string, string | number>): string => {
        const langDict = translations[currentLang] || translations.fr;
        let text = langDict[key] || translations.fr[key] || key;
        
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
            });
        }
        return text;
    };

    const getAmenityLabel = (amenity: string): string => {
        const key = amenity.toLowerCase().replace(/ /g, '_');
        const dict = AMENITY_TRANSLATIONS[currentLang] || AMENITY_TRANSLATIONS.fr;
        if (dict[key]) return dict[key];
        if (dict[amenity.toLowerCase()]) return dict[amenity.toLowerCase()];
        return amenity.replace(/_/g, ' ');
    };

    const formatPropertyType = (type?: string): string => {
        if (!type) return t('lodging');
        const cleanType = type.toLowerCase().trim();
        if (cleanType.includes('villa')) return t('villa');
        if (cleanType.includes('apart') || cleanType.includes('appartement')) return t('apartment');
        if (cleanType.includes('house') || cleanType.includes('maison')) return t('house');
        if (cleanType.includes('studio')) return t('studio');
        return t(cleanType) || type;
    };

    const formatRoomType = (type?: string): string => {
        if (!type) return t('lodging');
        const clean = type.toLowerCase().trim();
        if (clean === 'entire_place' || clean === 'logement entier') return t('entire_place');
        if (clean === 'private_room' || clean === 'chambre privée') return t('private_room');
        if (clean === 'shared_room' || clean === 'chambre partagée') return t('shared_room');
        if (clean === 'hotel_room' || clean === "chambre d'hôtel") return t('hotel_room');
        return t(clean) || type.replace(/_/g, ' ');
    };

    const formatCity = (city?: string) => formatCityHelper(city, currentLang);
    const formatCountry = (country?: string) => formatCountryHelper(country, currentLang);
    const formatLocation = (city?: string, country?: string) => formatLocationHelper(city, country, currentLang);

    return (
        <LanguageContext.Provider value={{
            currentLang,
            setLanguage,
            t,
            getAmenityLabel,
            formatPropertyType,
            formatRoomType,
            formatCity,
            formatCountry,
            formatLocation,
            isRTL
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
