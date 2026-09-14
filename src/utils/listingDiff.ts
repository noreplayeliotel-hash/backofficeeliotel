import type { Listing } from '../types';

export interface FieldDiff {
    field: string;
    label: string;
    hasChanged: boolean;
    oldValue: any;
    newValue: any;
    oldDisplay: string;
    newDisplay: string;
}

export interface ListingDiffResult {
    hasPendingEdit: boolean;
    totalChanges: number;
    changedFields: string[];
    diffs: Record<string, FieldDiff>;
    diffList: FieldDiff[];
}

export function computeListingDiff(listing: Listing): ListingDiffResult {
    const edits = (listing as any)?.pendingEdit;
    const hasPendingEdit = Boolean(edits && typeof edits === 'object');

    if (!hasPendingEdit) {
        return {
            hasPendingEdit: false,
            totalChanges: 0,
            changedFields: [],
            diffs: {},
            diffList: []
        };
    }

    const diffs: Record<string, FieldDiff> = {};

    // 1. Titre
    const oldTitle = (listing.title || '').trim();
    const newTitle = edits.title !== undefined ? String(edits.title).trim() : oldTitle;
    const titleChanged = edits.title !== undefined && oldTitle !== newTitle;
    diffs.title = {
        field: 'title',
        label: 'Titre de l\'annonce',
        hasChanged: titleChanged,
        oldValue: listing.title,
        newValue: edits.title ?? listing.title,
        oldDisplay: listing.title || 'Non renseigné',
        newDisplay: edits.title || 'Non renseigné'
    };

    // 2. Description
    const oldDesc = (listing.description || '').trim();
    const newDesc = edits.description !== undefined ? String(edits.description).trim() : oldDesc;
    const descChanged = edits.description !== undefined && oldDesc !== newDesc;
    diffs.description = {
        field: 'description',
        label: 'Description',
        hasChanged: descChanged,
        oldValue: listing.description,
        newValue: edits.description ?? listing.description,
        oldDisplay: listing.description || 'Non renseignée',
        newDisplay: edits.description || 'Non renseignée'
    };

    // 3. Type de propriété
    const oldProp = listing.propertyType || '';
    const newProp = edits.propertyType ?? oldProp;
    const propChanged = edits.propertyType !== undefined && oldProp !== newProp;
    diffs.propertyType = {
        field: 'propertyType',
        label: 'Type de propriété',
        hasChanged: propChanged,
        oldValue: oldProp,
        newValue: newProp,
        oldDisplay: oldProp || 'Non renseigné',
        newDisplay: newProp || 'Non renseigné'
    };

    // 4. Type de logement (roomType)
    const oldRoom = listing.roomType || '';
    const newRoom = edits.roomType ?? oldRoom;
    const roomChanged = edits.roomType !== undefined && oldRoom !== newRoom;
    diffs.roomType = {
        field: 'roomType',
        label: 'Type de chambre / logement',
        hasChanged: roomChanged,
        oldValue: oldRoom,
        newValue: newRoom,
        oldDisplay: oldRoom || 'Non renseigné',
        newDisplay: newRoom || 'Non renseigné'
    };

    // 5. Politique d'annulation
    const oldCancel = (listing as any).cancellationPolicy || 'flexible';
    const newCancel = edits.cancellationPolicy ?? oldCancel;
    const cancelChanged = edits.cancellationPolicy !== undefined && oldCancel !== newCancel;
    diffs.cancellationPolicy = {
        field: 'cancellationPolicy',
        label: 'Politique d\'annulation',
        hasChanged: cancelChanged,
        oldValue: oldCancel,
        newValue: newCancel,
        oldDisplay: oldCancel,
        newDisplay: newCancel
    };

    // 6. Prix par nuit (basePrice)
    const oldPrice = Number(listing.pricing?.basePrice ?? 0);
    const hasNewPrice = edits.pricing?.basePrice !== undefined || edits.basePrice !== undefined;
    const newPriceVal = edits.pricing?.basePrice ?? edits.basePrice;
    const newPrice = hasNewPrice ? Number(newPriceVal) : oldPrice;
    const currency = edits.pricing?.currency || listing.pricing?.currency || 'EUR';
    const priceChanged = hasNewPrice && Math.abs(oldPrice - newPrice) > 0.01;
    diffs.basePrice = {
        field: 'basePrice',
        label: 'Prix par nuit',
        hasChanged: priceChanged,
        oldValue: oldPrice,
        newValue: newPrice,
        oldDisplay: `${oldPrice} ${currency}`,
        newDisplay: `${newPrice} ${currency}`
    };

    // 7. Frais de ménage
    const oldCleaning = Number(listing.pricing?.cleaningFee ?? 0);
    const hasNewCleaning = edits.pricing?.cleaningFee !== undefined;
    const newCleaning = hasNewCleaning ? Number(edits.pricing.cleaningFee) : oldCleaning;
    const cleaningChanged = hasNewCleaning && Math.abs(oldCleaning - newCleaning) > 0.01;
    diffs.cleaningFee = {
        field: 'cleaningFee',
        label: 'Frais de ménage',
        hasChanged: cleaningChanged,
        oldValue: oldCleaning,
        newValue: newCleaning,
        oldDisplay: `${oldCleaning} ${currency}`,
        newDisplay: `${newCleaning} ${currency}`
    };

    // 8. Adresse
    const oldStreet = (listing.address?.street || '').trim();
    const newStreet = edits.address?.street !== undefined ? String(edits.address.street).trim() : oldStreet;
    const streetChanged = edits.address?.street !== undefined && oldStreet !== newStreet;
    diffs.street = {
        field: 'street',
        label: 'Adresse (Rue)',
        hasChanged: streetChanged,
        oldValue: oldStreet,
        newValue: newStreet,
        oldDisplay: oldStreet || 'Non renseignée',
        newDisplay: newStreet || 'Non renseignée'
    };

    const oldCity = (listing.address?.city || '').trim();
    const newCity = edits.address?.city !== undefined ? String(edits.address.city).trim() : oldCity;
    const cityChanged = edits.address?.city !== undefined && oldCity !== newCity;
    diffs.city = {
        field: 'city',
        label: 'Ville',
        hasChanged: cityChanged,
        oldValue: oldCity,
        newValue: newCity,
        oldDisplay: oldCity || 'Non renseignée',
        newDisplay: newCity || 'Non renseignée'
    };

    const oldCountry = (listing.address?.country || '').trim();
    const newCountry = edits.address?.country !== undefined ? String(edits.address.country).trim() : oldCountry;
    const countryChanged = edits.address?.country !== undefined && oldCountry !== newCountry;
    diffs.country = {
        field: 'country',
        label: 'Pays',
        hasChanged: countryChanged,
        oldValue: oldCountry,
        newValue: newCountry,
        oldDisplay: oldCountry || 'Non renseigné',
        newDisplay: newCountry || 'Non renseigné'
    };

    const oldState = (listing.address?.state || '').trim();
    const newState = edits.address?.state !== undefined ? String(edits.address.state).trim() : oldState;
    const stateChanged = edits.address?.state !== undefined && oldState !== newState;
    diffs.state = {
        field: 'state',
        label: 'Région / État',
        hasChanged: stateChanged,
        oldValue: oldState,
        newValue: newState,
        oldDisplay: oldState || 'Non renseignée',
        newDisplay: newState || 'Non renseignée'
    };

    const oldZip = (listing.address?.zipCode || '').trim();
    const newZip = edits.address?.zipCode !== undefined ? String(edits.address.zipCode).trim() : oldZip;
    const zipChanged = edits.address?.zipCode !== undefined && oldZip !== newZip;
    diffs.zipCode = {
        field: 'zipCode',
        label: 'Code postal',
        hasChanged: zipChanged,
        oldValue: oldZip,
        newValue: newZip,
        oldDisplay: oldZip || 'Non renseigné',
        newDisplay: newZip || 'Non renseigné'
    };

    // Coordonnées GPS
    const oldLat = (listing as any).location?.coordinates?.[1] ?? (listing as any).location?.latitude;
    const oldLng = (listing as any).location?.coordinates?.[0] ?? (listing as any).location?.longitude;
    const newLat = edits.location?.coordinates?.[1] ?? edits.location?.latitude;
    const newLng = edits.location?.coordinates?.[0] ?? edits.location?.longitude;
    const latChanged = newLat !== undefined && oldLat !== undefined && Math.abs(Number(newLat) - Number(oldLat)) > 0.0001;
    const lngChanged = newLng !== undefined && oldLng !== undefined && Math.abs(Number(newLng) - Number(oldLng)) > 0.0001;
    const locationChanged = latChanged || lngChanged;
    diffs.location = {
        field: 'location',
        label: 'Coordonnées GPS',
        hasChanged: locationChanged,
        oldValue: { lat: oldLat, lng: oldLng },
        newValue: { lat: newLat ?? oldLat, lng: newLng ?? oldLng },
        oldDisplay: oldLat && oldLng ? `${Number(oldLat).toFixed(4)}, ${Number(oldLng).toFixed(4)}` : 'Non définies',
        newDisplay: (newLat || oldLat) && (newLng || oldLng) ? `${Number(newLat ?? oldLat).toFixed(4)}, ${Number(newLng ?? oldLng).toFixed(4)}` : 'Non définies'
    };

    const addressOverallChanged = streetChanged || cityChanged || countryChanged || stateChanged || zipChanged || locationChanged;
    diffs.address = {
        field: 'address',
        label: 'Adresse & Localisation',
        hasChanged: addressOverallChanged,
        oldValue: listing.address,
        newValue: edits.address ?? listing.address,
        oldDisplay: `${oldStreet ? oldStreet + ', ' : ''}${oldCity} (${oldCountry})`.trim() || 'Non renseignée',
        newDisplay: `${newStreet ? newStreet + ', ' : ''}${newCity} (${newCountry})`.trim() || 'Non renseignée'
    };

    // 9. Capacité
    const oldGuests = Number(listing.capacity?.guests ?? 1);
    const newGuests = edits.capacity?.guests !== undefined ? Number(edits.capacity.guests) : oldGuests;
    const guestsChanged = edits.capacity?.guests !== undefined && oldGuests !== newGuests;
    diffs.guests = {
        field: 'guests',
        label: 'Voyageurs max',
        hasChanged: guestsChanged,
        oldValue: oldGuests,
        newValue: newGuests,
        oldDisplay: `${oldGuests} pers.`,
        newDisplay: `${newGuests} pers.`
    };

    const oldBedrooms = Number(listing.capacity?.bedrooms ?? 1);
    const newBedrooms = edits.capacity?.bedrooms !== undefined ? Number(edits.capacity.bedrooms) : oldBedrooms;
    const bedroomsChanged = edits.capacity?.bedrooms !== undefined && oldBedrooms !== newBedrooms;
    diffs.bedrooms = {
        field: 'bedrooms',
        label: 'Chambres',
        hasChanged: bedroomsChanged,
        oldValue: oldBedrooms,
        newValue: newBedrooms,
        oldDisplay: `${oldBedrooms} ch.`,
        newDisplay: `${newBedrooms} ch.`
    };

    const oldBeds = Number(listing.capacity?.beds ?? 1);
    const newBeds = edits.capacity?.beds !== undefined ? Number(edits.capacity.beds) : oldBeds;
    const bedsChanged = edits.capacity?.beds !== undefined && oldBeds !== newBeds;
    diffs.beds = {
        field: 'beds',
        label: 'Lits',
        hasChanged: bedsChanged,
        oldValue: oldBeds,
        newValue: newBeds,
        oldDisplay: `${oldBeds} lits`,
        newDisplay: `${newBeds} lits`
    };

    const oldBaths = Number(listing.capacity?.bathrooms ?? 1);
    const newBaths = edits.capacity?.bathrooms !== undefined ? Number(edits.capacity.bathrooms) : oldBaths;
    const bathsChanged = edits.capacity?.bathrooms !== undefined && Math.abs(oldBaths - newBaths) > 0.01;
    diffs.bathrooms = {
        field: 'bathrooms',
        label: 'Salles de bain',
        hasChanged: bathsChanged,
        oldValue: oldBaths,
        newValue: newBaths,
        oldDisplay: `${oldBaths} sdb`,
        newDisplay: `${newBaths} sdb`
    };

    const capacityOverallChanged = guestsChanged || bedroomsChanged || bedsChanged || bathsChanged;
    diffs.capacity = {
        field: 'capacity',
        label: 'Capacité d\'accueil',
        hasChanged: capacityOverallChanged,
        oldValue: listing.capacity,
        newValue: edits.capacity ?? listing.capacity,
        oldDisplay: `${oldGuests} voy. · ${oldBedrooms} ch. · ${oldBeds} lits · ${oldBaths} sdb`,
        newDisplay: `${newGuests} voy. · ${newBedrooms} ch. · ${newBeds} lits · ${newBaths} sdb`
    };

    // 10. Équipements (Amenities)
    const oldAmenities: string[] = Array.isArray(listing.amenities) ? [...listing.amenities].sort() : [];
    const hasNewAmenities = Array.isArray(edits.amenities);
    const newAmenities: string[] = hasNewAmenities ? [...edits.amenities].sort() : oldAmenities;
    const amenitiesChanged = hasNewAmenities && (
        oldAmenities.length !== newAmenities.length ||
        oldAmenities.some((item, idx) => item !== newAmenities[idx])
    );
    const addedAmenities = newAmenities.filter(a => !oldAmenities.includes(a));
    const removedAmenities = oldAmenities.filter(a => !newAmenities.includes(a));
    diffs.amenities = {
        field: 'amenities',
        label: 'Équipements',
        hasChanged: amenitiesChanged,
        oldValue: oldAmenities,
        newValue: newAmenities,
        oldDisplay: `${oldAmenities.length} équipements`,
        newDisplay: `${newAmenities.length} équipements${addedAmenities.length > 0 ? ` (+${addedAmenities.length})` : ''}${removedAmenities.length > 0 ? ` (-${removedAmenities.length})` : ''}`
    };

    // 11. Galerie Photos (Images) - IMPORTANT: Compare URL list, not raw JSON objects!
    const oldUrls: string[] = (listing.images || [])
        .map((img: any) => (typeof img === 'string' ? img : img?.url))
        .filter(Boolean);
    const hasNewImages = Array.isArray(edits.images);
    const newUrls: string[] = hasNewImages
        ? (edits.images as any[]).map((img: any) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
        : oldUrls;
    const imagesChanged = hasNewImages && (
        oldUrls.length !== newUrls.length ||
        oldUrls.some((url, idx) => url !== newUrls[idx])
    );
    diffs.images = {
        field: 'images',
        label: 'Galerie Photos',
        hasChanged: imagesChanged,
        oldValue: listing.images,
        newValue: edits.images ?? listing.images,
        oldDisplay: `${oldUrls.length} photos`,
        newDisplay: `${newUrls.length} photos`
    };

    // 12. Points forts (Highlights)
    const oldSelfCheckIn = Boolean((listing as any).highlights?.selfCheckIn ?? true);
    const newSelfCheckIn = edits.highlights?.selfCheckIn !== undefined ? Boolean(edits.highlights.selfCheckIn) : oldSelfCheckIn;
    const oldIdealLocation = Boolean((listing as any).highlights?.idealLocation ?? true);
    const newIdealLocation = edits.highlights?.idealLocation !== undefined ? Boolean(edits.highlights.idealLocation) : oldIdealLocation;
    const oldFreeCancel = Boolean((listing as any).highlights?.freeCancellation ?? true);
    const newFreeCancel = edits.highlights?.freeCancellation !== undefined ? Boolean(edits.highlights.freeCancellation) : oldFreeCancel;
    const highlightsChanged = (
        (edits.highlights?.selfCheckIn !== undefined && oldSelfCheckIn !== newSelfCheckIn) ||
        (edits.highlights?.idealLocation !== undefined && oldIdealLocation !== newIdealLocation) ||
        (edits.highlights?.freeCancellation !== undefined && oldFreeCancel !== newFreeCancel)
    );
    diffs.highlights = {
        field: 'highlights',
        label: 'Points forts',
        hasChanged: highlightsChanged,
        oldValue: (listing as any).highlights,
        newValue: edits.highlights ?? (listing as any).highlights,
        oldDisplay: `Arrivée auto: ${oldSelfCheckIn ? 'Oui' : 'Non'} · Emplacement: ${oldIdealLocation ? 'Oui' : 'Non'}`,
        newDisplay: `Arrivée auto: ${newSelfCheckIn ? 'Oui' : 'Non'} · Emplacement: ${newIdealLocation ? 'Oui' : 'Non'}`
    };

    // 13. Règlement intérieur (House Rules)
    const oldCheckIn = ((listing as any).houseRules?.checkIn || '15:00').trim();
    const newCheckIn = edits.houseRules?.checkIn !== undefined ? String(edits.houseRules.checkIn).trim() : oldCheckIn;
    const oldCheckOut = ((listing as any).houseRules?.checkOut || '11:00').trim();
    const newCheckOut = edits.houseRules?.checkOut !== undefined ? String(edits.houseRules.checkOut).trim() : oldCheckOut;
    const oldSmoking = Boolean((listing as any).houseRules?.smokingAllowed);
    const newSmoking = edits.houseRules?.smokingAllowed !== undefined ? Boolean(edits.houseRules.smokingAllowed) : oldSmoking;
    const oldPets = Boolean((listing as any).houseRules?.petsAllowed);
    const newPets = edits.houseRules?.petsAllowed !== undefined ? Boolean(edits.houseRules.petsAllowed) : oldPets;
    const oldParties = Boolean((listing as any).houseRules?.partiesAllowed);
    const newParties = edits.houseRules?.partiesAllowed !== undefined ? Boolean(edits.houseRules.partiesAllowed) : oldParties;
    const oldAddRules = Array.isArray((listing as any).houseRules?.additionalRules)
        ? (listing as any).houseRules.additionalRules.join('\n').trim()
        : '';
    const newAddRules = Array.isArray(edits.houseRules?.additionalRules)
        ? edits.houseRules.additionalRules.join('\n').trim()
        : oldAddRules;

    const rulesChanged = (
        (edits.houseRules?.checkIn !== undefined && oldCheckIn !== newCheckIn) ||
        (edits.houseRules?.checkOut !== undefined && oldCheckOut !== newCheckOut) ||
        (edits.houseRules?.smokingAllowed !== undefined && oldSmoking !== newSmoking) ||
        (edits.houseRules?.petsAllowed !== undefined && oldPets !== newPets) ||
        (edits.houseRules?.partiesAllowed !== undefined && oldParties !== newParties) ||
        (edits.houseRules?.additionalRules !== undefined && oldAddRules !== newAddRules)
    );
    diffs.houseRules = {
        field: 'houseRules',
        label: 'Règlement intérieur',
        hasChanged: rulesChanged,
        oldValue: (listing as any).houseRules,
        newValue: edits.houseRules ?? (listing as any).houseRules,
        oldDisplay: `In: ${oldCheckIn} · Out: ${oldCheckOut} · Animaux: ${oldPets ? 'Oui' : 'Non'} · Fumeur: ${oldSmoking ? 'Oui' : 'Non'}`,
        newDisplay: `In: ${newCheckIn} · Out: ${newCheckOut} · Animaux: ${newPets ? 'Oui' : 'Non'} · Fumeur: ${newSmoking ? 'Oui' : 'Non'}`
    };

    const diffList = Object.values(diffs);
    const changedDiffs = diffList.filter(d => d.hasChanged);
    const changedFields = changedDiffs.map(d => d.field);

    return {
        hasPendingEdit: true,
        totalChanges: changedDiffs.length,
        changedFields,
        diffs,
        diffList
    };
}
