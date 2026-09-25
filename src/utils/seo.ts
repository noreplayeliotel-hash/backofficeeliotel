import type { Language } from '../translations/translations';
import { formatCity, formatCountry } from './locationTranslator';

interface ListingSEOProps {
    _id: string;
    title: string;
    description?: string;
    images?: { url: string; isPrimary?: boolean }[];
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    location?: {
        type?: string;
        coordinates?: [number, number];
    };
    capacity?: {
        guests?: number;
        bedrooms?: number;
        beds?: number;
        bathrooms?: number;
    };
    pricing?: {
        basePrice?: number;
        currency?: string;
    };
    propertyType?: string;
    roomType?: string;
    amenities?: string[];
    ratings?: {
        average?: number;
        count?: number;
    };
}

/**
 * Met à jour dynamiquement le référencement naturel (SEO) multilingue
 * (Français, Anglais, Arabe, Allemand) pour chaque annonce et pour Google.
 */
export function updateListingSEO(listing: ListingSEOProps, lang: Language = 'fr') {
    const siteUrl = 'https://eliotel.com';
    const canonicalUrl = `${siteUrl}/listing/${listing._id}`;
    const rawCity = listing.address?.city || 'Tunisie';
    const rawCountry = listing.address?.country || 'Tunisie';
    const city = formatCity(rawCity, lang);
    const country = formatCountry(rawCountry, lang);
    const rawType = (listing.propertyType || 'Logement').toLowerCase();

    // 1. Dictionnaire de titres & descriptions multilingues pour Google
    let pageTitle = '';
    let description = '';
    let keywords = '';
    let ogLocale = 'fr_FR';
    let propertyTypeName = 'Logement';

    if (lang === 'en') {
        ogLocale = 'en_US';
        propertyTypeName = rawType.includes('villa') ? 'Luxury Villa' : rawType.includes('apart') ? 'Apartment' : 'Vacation Rental';
        pageTitle = `${listing.title} in ${city}, ${country} | ${propertyTypeName} - Eliotel`;
        
        const cap = [
            listing.capacity?.guests ? `${listing.capacity.guests} guests` : null,
            listing.capacity?.bedrooms ? `${listing.capacity.bedrooms} bedrooms` : null,
            listing.capacity?.bathrooms ? `${listing.capacity.bathrooms} baths` : null
        ].filter(Boolean).join(', ');
        
        const price = listing.pricing?.basePrice ? `From ${listing.pricing.basePrice} ${listing.pricing.currency || 'TND'} / night.` : '';
        description = `Book ${listing.title} in ${city}, ${country}. ${cap ? cap + '. ' : ''}${price} Secure direct booking on Eliotel.`;
        keywords = `${listing.title}, vacation rental ${city}, villa ${city}, apartment ${city}, holiday in ${country}, eliotel`;
    } else if (lang === 'ar') {
        ogLocale = 'ar_TN';
        propertyTypeName = rawType.includes('villa') ? 'فيلا فاخرة' : rawType.includes('apart') ? 'شقة مفروشة' : 'إقامة سياحية';
        pageTitle = `${listing.title} في ${city}، ${country} | ${propertyTypeName} - إيليوتيل`;
        
        const cap = [
            listing.capacity?.guests ? `${listing.capacity.guests} ضيوف` : null,
            listing.capacity?.bedrooms ? `${listing.capacity.bedrooms} غرف نوم` : null,
            listing.capacity?.bathrooms ? `${listing.capacity.bathrooms} حمامات` : null
        ].filter(Boolean).join('، ');
        
        const price = listing.pricing?.basePrice ? `ابتداءً من ${listing.pricing.basePrice} ${listing.pricing.currency || 'د.ت'} / ليلة.` : '';
        description = `احجز ${listing.title} في ${city}، ${country}. ${cap ? cap + '. ' : ''}${price} حجز فوري وموثوق مع إيليوتيل.`;
        keywords = `${listing.title}, كراء فيلا ${city}, شقق للكراء ${city}, عطلة في ${country}, إيليوتيل`;
    } else if (lang === 'de') {
        ogLocale = 'de_DE';
        propertyTypeName = rawType.includes('villa') ? 'Luxusvilla' : rawType.includes('apart') ? 'Ferienwohnung' : 'Ferienunterkunft';
        pageTitle = `${listing.title} in ${city}, ${country} | ${propertyTypeName} - Eliotel`;
        
        const cap = [
            listing.capacity?.guests ? `${listing.capacity.guests} Gäste` : null,
            listing.capacity?.bedrooms ? `${listing.capacity.bedrooms} Schlafzimmer` : null,
            listing.capacity?.bathrooms ? `${listing.capacity.bathrooms} Bäder` : null
        ].filter(Boolean).join(', ');
        
        const price = listing.pricing?.basePrice ? `Ab ${listing.pricing.basePrice} ${listing.pricing.currency || 'TND'} / Nacht.` : '';
        description = `Buchen Sie ${listing.title} in ${city}, ${country}. ${cap ? cap + '. ' : ''}${price} Exklusive Buchung auf Eliotel.`;
        keywords = `${listing.title}, Ferienunterkunft ${city}, Villa mieten ${city}, Ferienwohnung ${country}, Eliotel`;
    } else {
        // Français (défaut)
        ogLocale = 'fr_FR';
        propertyTypeName = rawType.includes('villa') ? 'Villa de luxe' : rawType.includes('apart') ? 'Appartement' : 'Location de vacances';
        pageTitle = `${listing.title} à ${city}, ${country} | ${propertyTypeName} - Eliotel`;
        
        const cap = [
            listing.capacity?.guests ? `${listing.capacity.guests} voyageurs` : null,
            listing.capacity?.bedrooms ? `${listing.capacity.bedrooms} chambres` : null,
            listing.capacity?.bathrooms ? `${listing.capacity.bathrooms} sdb` : null
        ].filter(Boolean).join(', ');
        
        const price = listing.pricing?.basePrice ? `Dès ${listing.pricing.basePrice} ${listing.pricing.currency || 'TND'} / nuit.` : '';
        description = `${listing.title} à ${city} (${country}). ${cap ? cap + '. ' : ''}${price} Réservez votre séjour d'exception sur Eliotel.`;
        keywords = `${listing.title}, location ${city}, villa ${city}, appartement ${city}, location vacances ${country}, eliotel`;
    }

    // 2. Application du Titre
    document.title = pageTitle;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Helper pour les balises <meta>
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
        let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute(attrName, attrValue);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    // Helper pour les balises <link>
    const setLinkTag = (rel: string, href: string, extraAttrs?: Record<string, string>) => {
        let selector = `link[rel="${rel}"]`;
        if (extraAttrs?.hreflang) {
            selector += `[hreflang="${extraAttrs.hreflang}"]`;
        }
        let element = document.querySelector(selector) as HTMLLinkElement | null;
        if (!element) {
            element = document.createElement('link');
            element.setAttribute('rel', rel);
            if (extraAttrs) {
                Object.entries(extraAttrs).forEach(([k, v]) => element!.setAttribute(k, v));
            }
            document.head.appendChild(element);
        }
        element.setAttribute('href', href);
    };

    const primaryImage = listing.images && listing.images.length > 0 
        ? listing.images[0].url 
        : `${siteUrl}/hero-villa.jpg`;

    // Balises SEO standard
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setLinkTag('canonical', canonicalUrl);

    // 3. Balises Hreflang pour le référencement international Google
    setLinkTag('alternate', `${canonicalUrl}?lang=fr`, { hreflang: 'fr' });
    setLinkTag('alternate', `${canonicalUrl}?lang=en`, { hreflang: 'en' });
    setLinkTag('alternate', `${canonicalUrl}?lang=ar`, { hreflang: 'ar' });
    setLinkTag('alternate', `${canonicalUrl}?lang=de`, { hreflang: 'de' });
    setLinkTag('alternate', canonicalUrl, { hreflang: 'x-default' });

    // 4. Balises Open Graph & Twitter
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', primaryImage);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', 'Eliotel');
    setMetaTag('property', 'og:locale', ogLocale);

    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', primaryImage);

    // 5. Données structurées Schema.org JSON-LD (Google Rich Snippets)
    const imagesList = (listing.images || []).map(img => img.url).filter(Boolean);
    const schemaData: any = {
        '@context': 'https://schema.org',
        '@type': 'VacationRental',
        '@id': canonicalUrl,
        'inLanguage': lang,
        'name': listing.title,
        'description': listing.description || description,
        'url': canonicalUrl,
        'image': imagesList.length > 0 ? imagesList : [primaryImage],
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': listing.address?.street || '',
            'addressLocality': city,
            'addressRegion': listing.address?.state || city,
            'postalCode': listing.address?.zipCode || '',
            'addressCountry': country
        },
        'containsPlace': {
            '@type': 'Accommodation',
            'numberOfRooms': listing.capacity?.bedrooms || 1,
            'numberOfBedrooms': listing.capacity?.bedrooms || 1,
            'numberOfBathroomsTotal': listing.capacity?.bathrooms || 1,
            'occupancy': {
                '@type': 'QuantitativeValue',
                'maxValue': listing.capacity?.guests || 2
            }
        }
    };

    if (listing.location?.coordinates && listing.location.coordinates.length >= 2) {
        schemaData.geo = {
            '@type': 'GeoCoordinates',
            'latitude': listing.location.coordinates[1],
            'longitude': listing.location.coordinates[0]
        };
    }

    if (listing.pricing?.basePrice) {
        schemaData.offers = {
            '@type': 'Offer',
            'price': listing.pricing.basePrice,
            'priceCurrency': listing.pricing.currency || 'TND',
            'availability': 'https://schema.org/InStock',
            'url': canonicalUrl
        };
    }

    if (listing.ratings && listing.ratings.count && listing.ratings.count > 0) {
        schemaData.aggregateRating = {
            '@type': 'AggregateRating',
            'ratingValue': listing.ratings.average?.toFixed(1) || '5.0',
            'reviewCount': listing.ratings.count,
            'bestRating': '5',
            'worstRating': '1'
        };
    }

    let scriptTag = document.getElementById('listing-schema-ld') as HTMLScriptElement | null;
    if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'listing-schema-ld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaData, null, 2);

    return () => {
        const schema = document.getElementById('listing-schema-ld');
        if (schema) {
            schema.remove();
        }
    };
}
