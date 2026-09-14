import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateListing, updateListingStatus } from '../services/adminService';
import type { Listing } from '../types';
import {
    Plus, Trash2, X, CheckCircle, AlertCircle, Calendar,
    TrendingUp, Edit3, MapPin, DollarSign, Home, Check, Eye,
    Image as ImageIcon, Shield, Clock, Sparkles, Star, RotateCcw,
    Sliders, FileText
} from 'lucide-react';
import { PendingChangesModal } from '../components/PendingChangesModal';
import { computeListingDiff } from '../utils/listingDiff';

type ToastType = 'success' | 'error';
interface Toast { id: number; message: string; type: ToastType; }

interface ExternalBlock {
    _id?: string;
    startDate: string;
    endDate: string;
    reason: string;
}

interface SeasonalPrice {
    _id?: string;
    startDate: string;
    endDate: string;
    price: number;
    label: string;
}

interface ListingEditPanelProps {
    listing: Listing;
    onClose: () => void;
    initialTab?: 'details' | 'blocks' | 'seasonal';
}

export const AMENITY_LIST = [
    // Essentiels
    { id: 'wifi', label: 'WiFi rapide', category: 'Essentiels' },
    { id: 'kitchen', label: 'Cuisine équipée', category: 'Essentiels' },
    { id: 'washer', label: 'Lave-linge', category: 'Essentiels' },
    { id: 'dryer', label: 'Sèche-linge', category: 'Essentiels' },
    { id: 'air_conditioning', label: 'Climatisation', category: 'Essentiels' },
    { id: 'heating', label: 'Chauffage', category: 'Essentiels' },
    { id: 'dedicated_workspace', label: 'Espace de travail', category: 'Essentiels' },
    { id: 'tv', label: 'Télévision', category: 'Essentiels' },
    { id: 'hair_dryer', label: 'Sèche-cheveux', category: 'Essentiels' },
    { id: 'iron', label: 'Fer à repasser', category: 'Essentiels' },
    { id: 'hangers', label: 'Cintres', category: 'Essentiels' },
    // Loisirs & Extérieur
    { id: 'pool', label: 'Piscine privée', category: 'Loisirs & Plein air' },
    { id: 'hot_tub', label: 'Jacuzzi / Spa', category: 'Loisirs & Plein air' },
    { id: 'gym', label: 'Salle de sport', category: 'Loisirs & Plein air' },
    { id: 'bbq_grill', label: 'Barbecue', category: 'Loisirs & Plein air' },
    { id: 'patio_balcony', label: 'Patio ou balcon', category: 'Loisirs & Plein air' },
    { id: 'garden', label: 'Jardin / Extérieur', category: 'Loisirs & Plein air' },
    { id: 'beachfront', label: 'Accès direct plage', category: 'Loisirs & Plein air' },
    // Accès & Parking
    { id: 'free_parking', label: 'Parking gratuit sur place', category: 'Accès & Parking' },
    { id: 'ev_charger', label: 'Borne recharge véhicule élec.', category: 'Accès & Parking' },
    { id: 'elevator', label: 'Ascenseur', category: 'Accès & Parking' },
    // Sécurité
    { id: 'smoke_alarm', label: 'Détecteur de fumée', category: 'Sécurité' },
    { id: 'carbon_monoxide_alarm', label: 'Détecteur de monoxyde', category: 'Sécurité' },
    { id: 'first_aid_kit', label: 'Kit de premiers secours', category: 'Sécurité' },
    { id: 'fire_extinguisher', label: 'Extincteur', category: 'Sécurité' },
    { id: 'security_cameras', label: 'Caméras extérieures', category: 'Sécurité' },
    { id: 'lockbox', label: 'Boîte à clé sécurisée', category: 'Sécurité' },
];

const ListingEditPanel: React.FC<ListingEditPanelProps> = ({ listing, onClose, initialTab = 'details' }) => {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'details' | 'blocks' | 'seasonal'>(initialTab);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [showDiffModal, setShowDiffModal] = useState(false);

    const edits = (listing as any).pendingEdit;
    const diffResult = computeListingDiff(listing);
    const hasPending = diffResult.hasPendingEdit;

    // Mode actuel : affiche les données proposées par l'hôte par défaut s'il y a un pendingEdit
    const [activeVersionMode, setActiveVersionMode] = useState<'proposed' | 'original'>(
        hasPending ? 'proposed' : 'original'
    );

    // Form state for full edit - Initialisé avec les modifications de l'hôte (ou données en ligne si inchangé)
    const [title, setTitle] = useState(edits?.title ?? listing.title ?? '');
    const [description, setDescription] = useState(edits?.description ?? listing.description ?? '');
    const [propertyType, setPropertyType] = useState(edits?.propertyType ?? listing.propertyType ?? 'apartment');
    const [roomType, setRoomType] = useState(edits?.roomType ?? listing.roomType ?? 'entire_place');
    const [status, setStatus] = useState<string>(listing.status || 'draft');
    const [cancellationPolicy, setCancellationPolicy] = useState<string>(
        edits?.cancellationPolicy ?? (listing as any).cancellationPolicy ?? 'flexible'
    );

    // Pricing
    const [basePrice, setBasePrice] = useState(
        edits?.pricing?.basePrice ?? edits?.basePrice ?? listing.pricing?.basePrice ?? 0
    );
    const [currency, setCurrency] = useState(
        edits?.pricing?.currency ?? listing.pricing?.currency ?? 'EUR'
    );
    const [cleaningFee, setCleaningFee] = useState(
        edits?.pricing?.cleaningFee ?? listing.pricing?.cleaningFee ?? 0
    );
    const [serviceFee, setServiceFee] = useState(
        edits?.pricing?.serviceFee ?? listing.pricing?.serviceFee ?? 0
    );

    // Address & Location
    const [street, setStreet] = useState(edits?.address?.street ?? listing.address?.street ?? '');
    const [city, setCity] = useState(edits?.address?.city ?? listing.address?.city ?? '');
    const [state, setState] = useState(edits?.address?.state ?? listing.address?.state ?? '');
    const [country, setCountry] = useState(edits?.address?.country ?? listing.address?.country ?? '');
    const [zipCode, setZipCode] = useState(edits?.address?.zipCode ?? listing.address?.zipCode ?? '');
    const [latitude, setLatitude] = useState<string | number>(
        edits?.location?.coordinates?.[1] ?? edits?.location?.latitude ??
        (listing as any).location?.coordinates?.[1] ?? (listing as any).location?.latitude ?? ''
    );
    const [longitude, setLongitude] = useState<string | number>(
        edits?.location?.coordinates?.[0] ?? edits?.location?.longitude ??
        (listing as any).location?.coordinates?.[0] ?? (listing as any).location?.longitude ?? ''
    );

    // Capacity
    const [guests, setGuests] = useState(edits?.capacity?.guests ?? listing.capacity?.guests ?? 1);
    const [bedrooms, setBedrooms] = useState(edits?.capacity?.bedrooms ?? listing.capacity?.bedrooms ?? 1);
    const [beds, setBeds] = useState(edits?.capacity?.beds ?? listing.capacity?.beds ?? 1);
    const [bathrooms, setBathrooms] = useState(edits?.capacity?.bathrooms ?? listing.capacity?.bathrooms ?? 1);

    // Amenities
    const [amenities, setAmenities] = useState<string[]>(
        Array.isArray(edits?.amenities) ? [...edits.amenities] :
        Array.isArray(listing.amenities) ? [...listing.amenities] : []
    );

    // Highlights
    const [selfCheckIn, setSelfCheckIn] = useState<boolean>(
        edits?.highlights?.selfCheckIn ?? (listing as any).highlights?.selfCheckIn ?? true
    );
    const [idealLocation, setIdealLocation] = useState<boolean>(
        edits?.highlights?.idealLocation ?? (listing as any).highlights?.idealLocation ?? true
    );
    const [freeCancellation, setFreeCancellation] = useState<boolean>(
        edits?.highlights?.freeCancellation ?? (listing as any).highlights?.freeCancellation ?? true
    );

    // Photos / Images
    const [images, setImages] = useState<Array<{ url: string; isPrimary?: boolean; caption?: string }>>(
        Array.isArray(edits?.images) ? [...edits.images] :
        Array.isArray(listing.images) ? [...listing.images] : []
    );
    const [newImageUrl, setNewImageUrl] = useState('');

    // House rules
    const [checkInTime, setCheckInTime] = useState(
        edits?.houseRules?.checkIn ?? (listing as any).houseRules?.checkIn ?? '15:00'
    );
    const [checkOutTime, setCheckOutTime] = useState(
        edits?.houseRules?.checkOut ?? (listing as any).houseRules?.checkOut ?? '11:00'
    );
    const [smokingAllowed, setSmokingAllowed] = useState<boolean>(
        edits?.houseRules?.smokingAllowed !== undefined
            ? Boolean(edits.houseRules.smokingAllowed)
            : Boolean((listing as any).houseRules?.smokingAllowed)
    );
    const [petsAllowed, setPetsAllowed] = useState<boolean>(
        edits?.houseRules?.petsAllowed !== undefined
            ? Boolean(edits.houseRules.petsAllowed)
            : Boolean((listing as any).houseRules?.petsAllowed)
    );
    const [partiesAllowed, setPartiesAllowed] = useState<boolean>(
        edits?.houseRules?.partiesAllowed !== undefined
            ? Boolean(edits.houseRules.partiesAllowed)
            : Boolean((listing as any).houseRules?.partiesAllowed)
    );
    const [additionalRulesText, setAdditionalRulesText] = useState<string>(
        Array.isArray(edits?.houseRules?.additionalRules)
            ? edits.houseRules.additionalRules.join('\n')
            : Array.isArray((listing as any).houseRules?.additionalRules)
                ? (listing as any).houseRules.additionalRules.join('\n')
                : ''
    );

    // External blocks state
    const [blocks, setBlocks] = useState<ExternalBlock[]>(
        ((listing as any).externalBlocks || []).map((b: any) => ({
            _id: b._id,
            startDate: new Date(b.startDate).toISOString().split('T')[0],
            endDate: new Date(b.endDate).toISOString().split('T')[0],
            reason: b.reason || 'Indisponible'
        }))
    );
    const [newBlock, setNewBlock] = useState<ExternalBlock>({ startDate: '', endDate: '', reason: 'Indisponible' });

    // Seasonal pricing state
    const [seasonal, setSeasonal] = useState<SeasonalPrice[]>(
        ((listing.pricing as any)?.seasonalPricing || []).map((s: any) => ({
            _id: s._id,
            startDate: new Date(s.startDate).toISOString().split('T')[0],
            endDate: new Date(s.endDate).toISOString().split('T')[0],
            price: s.price,
            label: s.label || ''
        }))
    );
    const [newSeasonal, setNewSeasonal] = useState<SeasonalPrice>({ startDate: '', endDate: '', price: 0, label: '' });

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const mutation = useMutation({
        mutationFn: (data: any) => updateListing(listing._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminListings'] });
            showToast('Modifications enregistrées avec succès');
        },
        onError: (e: any) => showToast(e.response?.data?.message || e.message, 'error')
    });

    const approvePendingMutation = useMutation({
        mutationFn: () => updateListingStatus(listing._id, 'active', { applyPendingEdit: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminListings'] });
            showToast('Modifications de l\'hôte approuvées et publiées avec succès !');
            onClose();
        },
        onError: (e: any) => showToast(e.response?.data?.message || e.message, 'error')
    });

    const rejectPendingMutation = useMutation({
        mutationFn: () => updateListingStatus(listing._id, listing.status, { rejectPendingEdit: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminListings'] });
            showToast('Modifications de l\'hôte rejetées. L\'ancienne version reste active.');
            onClose();
        },
        onError: (e: any) => showToast(e.response?.data?.message || e.message, 'error')
    });

    // Basculer vers les données d'origine en ligne
    const loadOriginalData = () => {
        setTitle(listing.title || '');
        setDescription(listing.description || '');
        setPropertyType(listing.propertyType || 'apartment');
        setRoomType(listing.roomType || 'entire_place');
        setCancellationPolicy((listing as any).cancellationPolicy || 'flexible');
        setBasePrice(listing.pricing?.basePrice ?? 0);
        setCurrency(listing.pricing?.currency || 'EUR');
        setCleaningFee(listing.pricing?.cleaningFee ?? 0);
        setServiceFee(listing.pricing?.serviceFee ?? 0);
        setStreet(listing.address?.street || '');
        setCity(listing.address?.city || '');
        setState(listing.address?.state || '');
        setCountry(listing.address?.country || '');
        setZipCode(listing.address?.zipCode || '');
        setLatitude((listing as any).location?.coordinates?.[1] ?? (listing as any).location?.latitude ?? '');
        setLongitude((listing as any).location?.coordinates?.[0] ?? (listing as any).location?.longitude ?? '');
        setGuests(listing.capacity?.guests ?? 1);
        setBedrooms(listing.capacity?.bedrooms ?? 1);
        setBeds(listing.capacity?.beds ?? 1);
        setBathrooms(listing.capacity?.bathrooms ?? 1);
        setAmenities(Array.isArray(listing.amenities) ? [...listing.amenities] : []);
        setSelfCheckIn((listing as any).highlights?.selfCheckIn ?? true);
        setIdealLocation((listing as any).highlights?.idealLocation ?? true);
        setFreeCancellation((listing as any).highlights?.freeCancellation ?? true);
        setImages(Array.isArray(listing.images) ? [...listing.images] : []);
        setCheckInTime((listing as any).houseRules?.checkIn || '15:00');
        setCheckOutTime((listing as any).houseRules?.checkOut || '11:00');
        setSmokingAllowed(Boolean((listing as any).houseRules?.smokingAllowed));
        setPetsAllowed(Boolean((listing as any).houseRules?.petsAllowed));
        setPartiesAllowed(Boolean((listing as any).houseRules?.partiesAllowed));
        setAdditionalRulesText(
            Array.isArray((listing as any).houseRules?.additionalRules)
                ? (listing as any).houseRules.additionalRules.join('\n')
                : ''
        );
        setActiveVersionMode('original');
        showToast('Données originales (en ligne) chargées dans le formulaire');
    };

    // Remplir le formulaire avec les valeurs proposées par l'hôte
    const loadPendingEditData = () => {
        if (!edits) return;
        if (edits.title !== undefined) setTitle(edits.title);
        if (edits.description !== undefined) setDescription(edits.description);
        if (edits.propertyType !== undefined) setPropertyType(edits.propertyType);
        if (edits.roomType !== undefined) setRoomType(edits.roomType);
        if (edits.cancellationPolicy !== undefined) setCancellationPolicy(edits.cancellationPolicy);
        if (edits.pricing?.basePrice !== undefined || edits.basePrice !== undefined) {
            setBasePrice(edits.pricing?.basePrice ?? edits.basePrice);
        }
        if (edits.pricing?.currency !== undefined) setCurrency(edits.pricing.currency);
        if (edits.pricing?.cleaningFee !== undefined) setCleaningFee(edits.pricing.cleaningFee);
        if (edits.pricing?.serviceFee !== undefined) setServiceFee(edits.pricing.serviceFee);
        if (edits.address?.street !== undefined) setStreet(edits.address.street);
        if (edits.address?.city !== undefined) setCity(edits.address.city);
        if (edits.address?.state !== undefined) setState(edits.address.state);
        if (edits.address?.country !== undefined) setCountry(edits.address.country);
        if (edits.address?.zipCode !== undefined) setZipCode(edits.address.zipCode);
        if (edits.location?.coordinates?.[1] !== undefined || edits.location?.latitude !== undefined) {
            setLatitude(edits.location?.coordinates?.[1] ?? edits.location?.latitude);
        }
        if (edits.location?.coordinates?.[0] !== undefined || edits.location?.longitude !== undefined) {
            setLongitude(edits.location?.coordinates?.[0] ?? edits.location?.longitude);
        }
        if (edits.capacity?.guests !== undefined) setGuests(edits.capacity.guests);
        if (edits.capacity?.bedrooms !== undefined) setBedrooms(edits.capacity.bedrooms);
        if (edits.capacity?.beds !== undefined) setBeds(edits.capacity.beds);
        if (edits.capacity?.bathrooms !== undefined) setBathrooms(edits.capacity.bathrooms);
        if (Array.isArray(edits.amenities)) setAmenities([...edits.amenities]);
        if (edits.highlights) {
            if (edits.highlights.selfCheckIn !== undefined) setSelfCheckIn(edits.highlights.selfCheckIn);
            if (edits.highlights.idealLocation !== undefined) setIdealLocation(edits.highlights.idealLocation);
            if (edits.highlights.freeCancellation !== undefined) setFreeCancellation(edits.highlights.freeCancellation);
        }
        if (Array.isArray(edits.images)) setImages([...edits.images]);
        if (edits.houseRules) {
            if (edits.houseRules.checkIn !== undefined) setCheckInTime(edits.houseRules.checkIn);
            if (edits.houseRules.checkOut !== undefined) setCheckOutTime(edits.houseRules.checkOut);
            if (edits.houseRules.smokingAllowed !== undefined) setSmokingAllowed(edits.houseRules.smokingAllowed);
            if (edits.houseRules.petsAllowed !== undefined) setPetsAllowed(edits.houseRules.petsAllowed);
            if (edits.houseRules.partiesAllowed !== undefined) setPartiesAllowed(edits.houseRules.partiesAllowed);
            if (Array.isArray(edits.houseRules.additionalRules)) {
                setAdditionalRulesText(edits.houseRules.additionalRules.join('\n'));
            }
        }
        setActiveVersionMode('proposed');
        showToast('Modifications de l\'hôte chargées dans le formulaire');
    };

    const isFieldChanged = (key: string): boolean => {
        return diffResult.diffs[key]?.hasChanged ?? false;
    };

    const restoreSingleField = (key: string) => {
        switch (key) {
            case 'title': setTitle(listing.title || ''); break;
            case 'description': setDescription(listing.description || ''); break;
            case 'propertyType': setPropertyType(listing.propertyType || 'apartment'); break;
            case 'roomType': setRoomType(listing.roomType || 'entire_place'); break;
            case 'cancellationPolicy': setCancellationPolicy((listing as any).cancellationPolicy || 'flexible'); break;
            case 'basePrice': setBasePrice(listing.pricing?.basePrice ?? 0); break;
            case 'cleaningFee': setCleaningFee(listing.pricing?.cleaningFee ?? 0); break;
            case 'serviceFee': setServiceFee(listing.pricing?.serviceFee ?? 0); break;
            case 'street': setStreet(listing.address?.street || ''); break;
            case 'city': setCity(listing.address?.city || ''); break;
            case 'state': setState(listing.address?.state || ''); break;
            case 'country': setCountry(listing.address?.country || ''); break;
            case 'zipCode': setZipCode(listing.address?.zipCode || ''); break;
            case 'location':
                setLatitude((listing as any).location?.coordinates?.[1] ?? (listing as any).location?.latitude ?? '');
                setLongitude((listing as any).location?.coordinates?.[0] ?? (listing as any).location?.longitude ?? '');
                break;
            case 'guests': setGuests(listing.capacity?.guests ?? 1); break;
            case 'bedrooms': setBedrooms(listing.capacity?.bedrooms ?? 1); break;
            case 'beds': setBeds(listing.capacity?.beds ?? 1); break;
            case 'bathrooms': setBathrooms(listing.capacity?.bathrooms ?? 1); break;
            case 'amenities': setAmenities(Array.isArray(listing.amenities) ? [...listing.amenities] : []); break;
            case 'highlights':
                setSelfCheckIn((listing as any).highlights?.selfCheckIn ?? true);
                setIdealLocation((listing as any).highlights?.idealLocation ?? true);
                setFreeCancellation((listing as any).highlights?.freeCancellation ?? true);
                break;
            case 'images': setImages(Array.isArray(listing.images) ? [...listing.images] : []); break;
            case 'houseRules':
                setCheckInTime((listing as any).houseRules?.checkIn || '15:00');
                setCheckOutTime((listing as any).houseRules?.checkOut || '11:00');
                setSmokingAllowed(Boolean((listing as any).houseRules?.smokingAllowed));
                setPetsAllowed(Boolean((listing as any).houseRules?.petsAllowed));
                setPartiesAllowed(Boolean((listing as any).houseRules?.partiesAllowed));
                setAdditionalRulesText(
                    Array.isArray((listing as any).houseRules?.additionalRules)
                        ? (listing as any).houseRules.additionalRules.join('\n')
                        : ''
                );
                break;
        }
        showToast(`Valeur originale rétablie pour ${diffResult.diffs[key]?.label || key}`);
    };

    const renderFieldBadge = (fieldKey: string) => {
        const diff = diffResult.diffs[fieldKey];
        if (!diff || !diff.hasChanged) return null;
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#92400E',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                padding: '2px 7px',
                borderRadius: '6px',
                marginLeft: '8px',
                verticalAlign: 'middle'
            }}>
                <span>⚠️ Modifié par l'hôte</span>
                {diff.oldDisplay && (
                    <span style={{ color: '#78350F', fontWeight: 400 }}>
                        (En ligne : <em>{diff.oldDisplay}</em>)
                    </span>
                )}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        restoreSingleField(fieldKey);
                    }}
                    style={{
                        background: 'white',
                        border: '1px solid #D97706',
                        borderRadius: '4px',
                        color: '#92400E',
                        fontSize: '10px',
                        cursor: 'pointer',
                        padding: '1px 5px',
                        marginLeft: '3px',
                        fontWeight: 700
                    }}
                    title="Rétablir la valeur d'origine en ligne pour ce champ"
                >
                    Rétablir
                </button>
            </span>
        );
    };

    const toggleAmenity = (amenityId: string) => {
        setAmenities(prev =>
            prev.includes(amenityId)
                ? prev.filter(a => a !== amenityId)
                : [...prev, amenityId]
        );
    };

    const addImage = () => {
        if (!newImageUrl.trim()) return;
        try {
            new URL(newImageUrl);
        } catch {
            showToast('Veuillez entrer une URL d\'image valide', 'error');
            return;
        }
        const isFirst = images.length === 0;
        setImages(prev => [...prev, { url: newImageUrl.trim(), isPrimary: isFirst, caption: '' }]);
        setNewImageUrl('');
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const next = prev.filter((_, i) => i !== index);
            if (next.length > 0 && !next.some(img => img.isPrimary)) {
                next[0].isPrimary = true;
            }
            return next;
        });
    };

    const setPrimaryImage = (index: number) => {
        setImages(prev => prev.map((img, i) => ({
            ...img,
            isPrimary: i === index
        })));
    };

    const saveDetails = () => {
        if (!title.trim()) {
            showToast('Le titre est requis', 'error');
            return;
        }
        if (basePrice <= 0) {
            showToast('Le prix de base doit être supérieur à 0', 'error');
            return;
        }

        const additionalRules = additionalRulesText
            .split('\n')
            .map(r => r.trim())
            .filter(Boolean);

        const payload: any = {
            title: title.trim(),
            description: description.trim(),
            propertyType,
            roomType,
            status,
            cancellationPolicy,
            amenities,
            images,
            pricing: {
                basePrice: Number(basePrice),
                currency,
                cleaningFee: Number(cleaningFee),
                serviceFee: Number(serviceFee)
            },
            address: {
                street,
                city,
                state,
                country,
                zipCode
            },
            capacity: {
                guests: Number(guests),
                bedrooms: Number(bedrooms),
                beds: Number(beds),
                bathrooms: Number(bathrooms)
            },
            houseRules: {
                checkIn: checkInTime,
                checkOut: checkOutTime,
                smokingAllowed,
                petsAllowed,
                partiesAllowed,
                additionalRules
            },
            highlights: {
                selfCheckIn,
                idealLocation,
                freeCancellation
            }
        };

        if (latitude !== '' && longitude !== '') {
            payload.location = {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)]
            };
        }

        if (listing.pendingEdit) {
            payload.clearPendingEdit = true;
        }

        mutation.mutate(payload);
    };

    const saveBlocks = () => mutation.mutate({ externalBlocks: blocks });
    const saveSeasonal = () => mutation.mutate({ seasonalPricing: seasonal });

    const addBlock = () => {
        if (!newBlock.startDate || !newBlock.endDate) return;
        if (new Date(newBlock.endDate) <= new Date(newBlock.startDate)) {
            showToast('La date de fin doit être après la date de début', 'error');
            return;
        }
        setBlocks(prev => [...prev, { ...newBlock }]);
        setNewBlock({ startDate: '', endDate: '', reason: 'Indisponible' });
    };

    const addSeasonal = () => {
        if (!newSeasonal.startDate || !newSeasonal.endDate || !newSeasonal.price) return;
        if (new Date(newSeasonal.endDate) <= new Date(newSeasonal.startDate)) {
            showToast('La date de fin doit être après la date de début', 'error');
            return;
        }
        setSeasonal(prev => [...prev, { ...newSeasonal }]);
        setNewSeasonal({ startDate: '', endDate: '', price: 0, label: '' });
    };

    const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

    return ReactDOM.createPortal(
        <>
            {/* Toasts */}
            {toasts.length > 0 && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'all' }}>
                        {toasts.map(t => (
                            <div key={t.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
                                borderRadius: '10px', minWidth: '320px', background: 'white',
                                borderLeft: `4px solid ${t.type === 'error' ? '#dc2626' : '#16a34a'}`,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                            }}>
                                {t.type === 'error' ? <AlertCircle size={20} color="#dc2626" /> : <CheckCircle size={20} color="#16a34a" />}
                                <span style={{ fontSize: '14px', flex: 1, fontWeight: 500 }}>{t.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay */}
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000 }} onClick={onClose} />

            {/* Panel */}
            <div className="listing-edit-panel" style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 9001, background: 'white',
                borderRadius: '20px 20px 0 0',
                height: '88vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
                maxWidth: '960px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {listing.title}
                            </h2>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '12px',
                                backgroundColor: status === 'active' ? '#DEF7EC' : status === 'pending' ? '#FEF3C7' : status === 'suspended' ? '#FDE8E8' : '#F3F4F6',
                                color: status === 'active' ? '#03543F' : status === 'pending' ? '#92400E' : status === 'suspended' ? '#9B1C1C' : '#4B5563'
                            }}>
                                {status === 'active' ? 'Actif' : status === 'pending' ? 'En attente de validation' : status === 'suspended' ? 'Suspendu' : 'Brouillon'}
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--light)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {listing.address?.city}, {listing.address?.country} · {listing.pricing?.basePrice} {listing.pricing?.currency}/nuit
                            {typeof listing.host === 'object' && ` · Hôte: ${listing.host.firstName} ${listing.host.lastName}`}
                        </p>
                    </div>
                    <div onClick={onClose} style={{ cursor: 'pointer', color: 'var(--light)', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '4px' }}>
                        <X size={22} />
                    </div>
                </div>

                {/* Alerte Modifications soumises par l'hôte */}
                {listing.pendingEdit && (
                    <div style={{
                        margin: '14px 20px 0',
                        padding: '14px 18px',
                        backgroundColor: '#FFFBEB',
                        border: '1.5px solid #FCD34D',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ minWidth: '240px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>⚠️</span> Modifications de l'hôte en attente d'approbation
                                    </h4>
                                    <span style={{
                                        backgroundColor: '#FEF3C7',
                                        color: '#B45309',
                                        border: '1px solid #FCD34D',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: 700
                                    }}>
                                        {diffResult.totalChanges} modification{diffResult.totalChanges > 1 ? 's' : ''} détectée{diffResult.totalChanges > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#B45309', lineHeight: 1.4 }}>
                                    Le formulaire ci-dessous est actuellement chargé avec les <strong>{activeVersionMode === 'proposed' ? 'valeurs proposées par l\'hôte' : 'données originales en ligne'}</strong>. Vous pouvez basculer d'une version à l'autre, corriger chaque champ, ou valider.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                                {/* Boutons de bascule Version Hôte / Version En Ligne */}
                                <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid #D97706', overflow: 'hidden', backgroundColor: 'white' }}>
                                    <button
                                        type="button"
                                        onClick={loadPendingEditData}
                                        style={{
                                            padding: '6px 11px',
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: activeVersionMode === 'proposed' ? '#D97706' : 'white',
                                            color: activeVersionMode === 'proposed' ? 'white' : '#92400E'
                                        }}
                                        title="Afficher les modifications envoyées par l'hôte"
                                    >
                                        ⭐ Version Hôte
                                    </button>
                                    <button
                                        type="button"
                                        onClick={loadOriginalData}
                                        style={{
                                            padding: '6px 11px',
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            border: 'none',
                                            borderLeft: '1px solid #D97706',
                                            cursor: 'pointer',
                                            backgroundColor: activeVersionMode === 'original' ? '#4B5563' : 'white',
                                            color: activeVersionMode === 'original' ? 'white' : '#4B5563'
                                        }}
                                        title="Afficher la version actuellement en ligne"
                                    >
                                        📋 En ligne (Original)
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowDiffModal(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        backgroundColor: '#4338CA', color: 'white', border: 'none',
                                        borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Eye size={14} /> Comparatif détaillé
                                </button>
                                <button
                                    type="button"
                                    onClick={() => approvePendingMutation.mutate()}
                                    disabled={approvePendingMutation.isPending || rejectPendingMutation.isPending}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        backgroundColor: '#16A34A', color: 'white', border: 'none',
                                        borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Check size={14} /> Approuver & Publier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm('Voulez-vous rejeter ces modifications ? L\'annonce conservera ses anciennes données.')) {
                                            rejectPendingMutation.mutate();
                                        }
                                    }}
                                    disabled={approvePendingMutation.isPending || rejectPendingMutation.isPending}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        backgroundColor: '#EF4444', color: 'white', border: 'none',
                                        borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={14} /> Rejeter
                                </button>
                            </div>
                        </div>

                        {/* Comparatif synthétique des réels changements (sans faux positifs) */}
                        {diffResult.totalChanges > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', background: '#FEF3C7', padding: '8px 12px', borderRadius: '8px', color: '#78350F' }}>
                                {diffResult.diffList.filter(d => d.hasChanged).map(d => (
                                    <div key={d.field} style={{ background: 'rgba(255,255,255,0.8)', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                                        <strong>{d.label} :</strong> {d.oldDisplay} ➔ <em style={{ fontWeight: 700, color: '#15803D' }}>{d.newDisplay}</em>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: '11.5px', color: '#92400E', fontStyle: 'italic', background: '#FEF3C7', padding: '6px 10px', borderRadius: '6px' }}>
                                Les données soumises sont identiques à la version en ligne.
                            </div>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid var(--border)', padding: '0 20px', overflowX: 'auto' }}>
                    {[
                        { key: 'details', label: 'Édition complète', icon: <Edit3 size={16} /> },
                        { key: 'blocks', label: 'Dates bloquées', icon: <Calendar size={16} />, badge: blocks.length },
                        { key: 'seasonal', label: 'Prix saisonniers', icon: <TrendingUp size={16} />, badge: seasonal.length }
                    ].map(t => (
                        <div key={t.key} onClick={() => setTab(t.key as any)} style={{
                            padding: '12px 18px', cursor: 'pointer',
                            fontSize: '13.5px', fontWeight: tab === t.key ? '600' : '400',
                            color: tab === t.key ? 'var(--primary)' : 'var(--light)',
                            borderBottom: tab === t.key ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px',
                            marginBottom: '-1px', whiteSpace: 'nowrap', flexShrink: 0, userSelect: 'none'
                        }}>
                            {t.icon} {t.label}
                            {t.badge !== undefined && (
                                <span style={{ background: tab === t.key ? 'var(--primary)' : '#e5e7eb', color: tab === t.key ? 'white' : 'var(--light)', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '600' }}>
                                    {t.badge}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

                    {/* ── COMPLETE DETAILS EDIT (Admin) ── */}
                    {tab === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Validation / Status Alert if Pending */}
                            {status === 'pending' && (
                                <div style={{
                                    backgroundColor: '#FEF3C7',
                                    border: '1px solid #FCD34D',
                                    borderRadius: '10px',
                                    padding: '14px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <AlertCircle size={20} color="#D97706" />
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '13.5px', color: '#92400E', margin: 0 }}>
                                                Modifications en attente de confirmation admin
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#B45309', margin: '2px 0 0' }}>
                                                L'hôte a soumis de nouvelles modifications sur cette annonce. Vous pouvez les ajuster ci-dessous ou la valider directement.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStatus('active');
                                            mutation.mutate({ status: 'active' });
                                        }}
                                        style={{
                                            backgroundColor: '#16A34A',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Check size={16} /> Valider & Activer
                                    </button>
                                </div>
                            )}

                            {/* 1. Informations Générales & Statut */}
                            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <Home size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>1. Informations Générales & Statut</h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Titre de l'annonce</label>
                                            {renderFieldBadge('title')}
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('title') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('title') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Description</label>
                                            {renderFieldBadge('description')}
                                        </div>
                                        <textarea
                                            className="input-field"
                                            rows={4}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                resize: 'vertical',
                                                border: isFieldChanged('description') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('description') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '4px' }}>Statut</label>
                                        <select
                                            className="input-field"
                                            value={status}
                                            onChange={e => setStatus(e.target.value)}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <option value="active">Actif (Visible)</option>
                                            <option value="pending">En attente (Validation requise)</option>
                                            <option value="draft">Brouillon</option>
                                            <option value="suspended">Suspendu</option>
                                            <option value="inactive">En pause</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Type de propriété</label>
                                            {renderFieldBadge('propertyType')}
                                        </div>
                                        <select
                                            className="input-field"
                                            value={propertyType}
                                            onChange={e => setPropertyType(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('propertyType') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('propertyType') ? '#FFFDF5' : undefined
                                            }}
                                        >
                                            <option value="apartment">Appartement</option>
                                            <option value="house">Maison</option>
                                            <option value="villa">Villa</option>
                                            <option value="studio">Studio</option>
                                            <option value="loft">Loft</option>
                                            <option value="townhouse">Maison de ville</option>
                                            <option value="cabin">Cabane</option>
                                            <option value="cottage">Cottage / Gîte</option>
                                            <option value="chalet">Chalet</option>
                                            <option value="castle">Château / Manoir</option>
                                            <option value="boat">Bateau</option>
                                            <option value="camper">Camping-car / Caravane</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Type de logement</label>
                                            {renderFieldBadge('roomType')}
                                        </div>
                                        <select
                                            className="input-field"
                                            value={roomType}
                                            onChange={e => setRoomType(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('roomType') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('roomType') ? '#FFFDF5' : undefined
                                            }}
                                        >
                                            <option value="entire_place">Logement entier</option>
                                            <option value="private_room">Chambre privée</option>
                                            <option value="shared_room">Chambre partagée</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Politique d'annulation</label>
                                            {renderFieldBadge('cancellationPolicy')}
                                        </div>
                                        <select
                                            className="input-field"
                                            value={cancellationPolicy}
                                            onChange={e => setCancellationPolicy(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('cancellationPolicy') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('cancellationPolicy') ? '#FFFDF5' : undefined
                                            }}
                                        >
                                            <option value="flexible">Flexible (100% jusqu'à 24h)</option>
                                            <option value="moderate">Modérée (100% jusqu'à 30j, 50% jusqu'à 7j)</option>
                                            <option value="strict">Stricte (100% sous 48h, 50% jusqu'à 14j)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Localisation & Coordonnées GPS */}
                            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    <MapPin size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>2. Localisation & Coordonnées GPS</h3>
                                    {renderFieldBadge('address')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Rue / Adresse</label>
                                            {renderFieldBadge('street')}
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={street}
                                            onChange={e => setStreet(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('street') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('street') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Ville</label>
                                            {renderFieldBadge('city')}
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('city') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('city') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Pays</label>
                                            {renderFieldBadge('country')}
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={country}
                                            onChange={e => setCountry(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('country') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('country') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Région / État</label>
                                            {renderFieldBadge('state')}
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={state}
                                            onChange={e => setState(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('state') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('state') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Code Postal</label>
                                            {renderFieldBadge('zipCode')}
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={zipCode}
                                            onChange={e => setZipCode(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('zipCode') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('zipCode') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Latitude GPS</label>
                                            {renderFieldBadge('location')}
                                        </div>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            className="input-field"
                                            placeholder="Ex: 36.8065"
                                            value={latitude}
                                            onChange={e => setLatitude(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('location') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('location') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Longitude GPS</label>
                                            {renderFieldBadge('location')}
                                        </div>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            className="input-field"
                                            placeholder="Ex: 10.1815"
                                            value={longitude}
                                            onChange={e => setLongitude(e.target.value)}
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('location') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('location') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Capacité d'accueil */}
                            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>3. Capacité d'accueil</h3>
                                    {renderFieldBadge('capacity')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Voyageurs max</label>
                                            {renderFieldBadge('guests')}
                                        </div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={guests}
                                            onChange={e => setGuests(parseInt(e.target.value) || 1)}
                                            min="1"
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('guests') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('guests') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Chambres</label>
                                            {renderFieldBadge('bedrooms')}
                                        </div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={bedrooms}
                                            onChange={e => setBedrooms(parseInt(e.target.value) || 0)}
                                            min="0"
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('bedrooms') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('bedrooms') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Lits</label>
                                            {renderFieldBadge('beds')}
                                        </div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={beds}
                                            onChange={e => setBeds(parseInt(e.target.value) || 1)}
                                            min="1"
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('beds') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('beds') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Salles de bain</label>
                                            {renderFieldBadge('bathrooms')}
                                        </div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={bathrooms}
                                            onChange={e => setBathrooms(parseFloat(e.target.value) || 1)}
                                            min="0.5"
                                            step="0.5"
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('bathrooms') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('bathrooms') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Équipements proposés (Amenities) */}
                            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <Sparkles size={18} color="var(--primary)" />
                                        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                                            4. Équipements proposés ({amenities.length} sélectionnés)
                                        </h3>
                                        {renderFieldBadge('amenities')}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setAmenities(AMENITY_LIST.map(a => a.id))}
                                            style={{
                                                fontSize: '11px', padding: '4px 8px', border: '1px solid #D1D5DB',
                                                borderRadius: '6px', background: 'white', cursor: 'pointer'
                                            }}
                                        >
                                            Tout sélectionner
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAmenities([])}
                                            style={{
                                                fontSize: '11px', padding: '4px 8px', border: '1px solid #D1D5DB',
                                                borderRadius: '6px', background: 'white', cursor: 'pointer'
                                            }}
                                        >
                                            Tout désélectionner
                                        </button>
                                    </div>
                                </div>

                                {['Essentiels', 'Loisirs & Plein air', 'Accès & Parking', 'Sécurité'].map(category => {
                                    const items = AMENITY_LIST.filter(a => a.category === category);
                                    return (
                                        <div key={category} style={{ marginBottom: '14px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', margin: '0 0 6px' }}>{category}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {items.map(amenity => {
                                                    const isChecked = amenities.includes(amenity.id);
                                                    return (
                                                        <button
                                                            key={amenity.id}
                                                            type="button"
                                                            onClick={() => toggleAmenity(amenity.id)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '6px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '12px',
                                                                border: isChecked ? '1.5px solid #16A34A' : '1px solid #D1D5DB',
                                                                backgroundColor: isChecked ? '#F0FDF4' : 'white',
                                                                color: isChecked ? '#15803D' : '#374151',
                                                                cursor: 'pointer',
                                                                fontWeight: isChecked ? 600 : 400
                                                            }}
                                                        >
                                                            {isChecked ? <Check size={13} color="#16A34A" /> : <Plus size={13} color="#9CA3AF" />}
                                                            {amenity.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 5. Points forts du logement (Highlights) */}
                            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    <Star size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>5. Points forts du logement</h3>
                                    {renderFieldBadge('highlights')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                    <label style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '12px 14px', borderRadius: '10px', background: 'white',
                                        border: selfCheckIn ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selfCheckIn}
                                            onChange={e => setSelfCheckIn(e.target.checked)}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Arrivée autonome</p>
                                            <span style={{ fontSize: '11px', color: '#6B7280' }}>Boîte à clé ou digicode</span>
                                        </div>
                                    </label>

                                    <label style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '12px 14px', borderRadius: '10px', background: 'white',
                                        border: idealLocation ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={idealLocation}
                                            onChange={e => setIdealLocation(e.target.checked)}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Emplacement idéal</p>
                                            <span style={{ fontSize: '11px', color: '#6B7280' }}>Proximité commodités</span>
                                        </div>
                                    </label>

                                    <label style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '12px 14px', borderRadius: '10px', background: 'white',
                                        border: freeCancellation ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={freeCancellation}
                                            onChange={e => setFreeCancellation(e.target.checked)}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Annulation gratuite</p>
                                            <span style={{ fontSize: '11px', color: '#6B7280' }}>Remboursement sans frais</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* 6. Photos du logement (Galerie) */}
                            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    <ImageIcon size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                                        6. Photos du logement ({images.length} photos)
                                    </h3>
                                    {renderFieldBadge('images')}
                                </div>

                                {/* Formulaire ajout photo */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <input
                                        type="url"
                                        placeholder="Coller l'URL d'une nouvelle photo (ex: https://...)"
                                        className="input-field"
                                        value={newImageUrl}
                                        onChange={e => setNewImageUrl(e.target.value)}
                                        style={{ marginBottom: 0, flex: 1 }}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                                    />
                                    <button
                                        type="button"
                                        onClick={addImage}
                                        style={{
                                            padding: '8px 16px', background: 'var(--primary)', color: 'white',
                                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600,
                                            flexShrink: 0
                                        }}
                                    >
                                        <Plus size={15} /> Ajouter photo
                                    </button>
                                </div>

                                {/* Grille des photos */}
                                {images.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px', padding: '16px' }}>
                                        Aucune photo enregistrée. Ajoutez-en via le champ ci-dessus.
                                    </p>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                        gap: '12px'
                                    }}>
                                        {images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    border: img.isPrimary ? '2.5px solid #16A34A' : isFieldChanged('images') ? '1.5px solid #F59E0B' : '1px solid var(--border)',
                                                    backgroundColor: 'white',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ width: '100%', height: '110px', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                                                    <img
                                                        src={img.url}
                                                        alt={`Photo ${idx + 1}`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e: any) => { e.target.src = 'https://via.placeholder.com/200x150?text=Photo'; }}
                                                    />
                                                </div>
                                                {img.isPrimary && (
                                                    <span style={{
                                                        position: 'absolute', top: '6px', left: '6px',
                                                        backgroundColor: '#16A34A', color: 'white',
                                                        fontSize: '10px', fontWeight: 700, padding: '2px 6px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        Principale
                                                    </span>
                                                )}
                                                <div style={{ padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                                                    {!img.isPrimary ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPrimaryImage(idx)}
                                                            style={{
                                                                fontSize: '11px', padding: '3px 6px', border: '1px solid #D1D5DB',
                                                                borderRadius: '4px', background: 'white', cursor: 'pointer', color: '#4B5563'
                                                            }}
                                                        >
                                                            Principale
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>En couverture</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: '#DC2626', padding: '3px'
                                                        }}
                                                        title="Supprimer cette photo"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 7. Tarification */}
                            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    <DollarSign size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>7. Tarification</h3>
                                    {renderFieldBadge('basePrice')}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Prix de base / nuit</label>
                                            {renderFieldBadge('basePrice')}
                                        </div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={basePrice}
                                            onChange={e => setBasePrice(parseFloat(e.target.value) || 0)}
                                            min="1"
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('basePrice') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('basePrice') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '4px' }}>Devise</label>
                                        <select
                                            className="input-field"
                                            value={currency}
                                            onChange={e => setCurrency(e.target.value as any)}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <option value="EUR">EUR (€)</option>
                                            <option value="TND">TND (DT)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Frais de ménage</label>
                                            {renderFieldBadge('cleaningFee')}
                                        </div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={cleaningFee}
                                            onChange={e => setCleaningFee(parseFloat(e.target.value) || 0)}
                                            min="0"
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('cleaningFee') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('cleaningFee') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)' }}>Frais de service</label>
                                            {renderFieldBadge('serviceFee')}
                                        </div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={serviceFee}
                                            onChange={e => setServiceFee(parseFloat(e.target.value) || 0)}
                                            min="0"
                                            style={{
                                                marginBottom: 0,
                                                border: isFieldChanged('serviceFee') ? '1.5px solid #F59E0B' : undefined,
                                                backgroundColor: isFieldChanged('serviceFee') ? '#FFFDF5' : undefined
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 8. Règlement intérieur (House Rules) */}
                            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    <Shield size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>8. Règlement intérieur</h3>
                                    {renderFieldBadge('houseRules')}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '4px' }}>Heure d'arrivée (Check-in)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Ex: 15:00"
                                            value={checkInTime}
                                            onChange={e => setCheckInTime(e.target.value)}
                                            style={{ marginBottom: 0 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '4px' }}>Heure de départ (Check-out)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Ex: 11:00"
                                            value={checkOutTime}
                                            onChange={e => setCheckOutTime(e.target.value)}
                                            style={{ marginBottom: 0 }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '4px' }}>Fumeurs autorisés</label>
                                        <select
                                            className="input-field"
                                            value={smokingAllowed ? 'yes' : 'no'}
                                            onChange={e => setSmokingAllowed(e.target.value === 'yes')}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <option value="no">Non (Non-fumeur)</option>
                                            <option value="yes">Oui (Fumeurs acceptés)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '4px' }}>Animaux autorisés</label>
                                        <select
                                            className="input-field"
                                            value={petsAllowed ? 'yes' : 'no'}
                                            onChange={e => setPetsAllowed(e.target.value === 'yes')}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <option value="no">Non (Animaux interdits)</option>
                                            <option value="yes">Oui (Animaux acceptés)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '4px' }}>Fêtes & Événements</label>
                                        <select
                                            className="input-field"
                                            value={partiesAllowed ? 'yes' : 'no'}
                                            onChange={e => setPartiesAllowed(e.target.value === 'yes')}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <option value="no">Non (Fêtes interdites)</option>
                                            <option value="yes">Oui (Fêtes autorisées)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: '4px' }}>
                                        Règles supplémentaires (une par ligne)
                                    </label>
                                    <textarea
                                        className="input-field"
                                        rows={3}
                                        placeholder="Ex:&#10;Pas de bruit après 22h&#10;Retirer ses chaussures à l'entrée"
                                        value={additionalRulesText}
                                        onChange={e => setAdditionalRulesText(e.target.value)}
                                        style={{ marginBottom: 0, resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── EXTERNAL BLOCKS ── */}
                    {tab === 'blocks' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
                                <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>Ajouter un blocage</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Début</label>
                                        <input type="date" className="input-field" value={newBlock.startDate}
                                            onChange={e => setNewBlock(p => ({ ...p, startDate: e.target.value }))}
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Fin</label>
                                        <input type="date" className="input-field" value={newBlock.endDate}
                                            min={newBlock.startDate}
                                            onChange={e => setNewBlock(p => ({ ...p, endDate: e.target.value }))}
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Raison</label>
                                    <input type="text" className="input-field" value={newBlock.reason}
                                        onChange={e => setNewBlock(p => ({ ...p, reason: e.target.value }))}
                                        placeholder="Ex: Maintenance, Usage personnel..."
                                        style={{ marginBottom: 0 }} />
                                </div>
                                <button onClick={addBlock} disabled={!newBlock.startDate || !newBlock.endDate}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', opacity: (!newBlock.startDate || !newBlock.endDate) ? 0.5 : 1 }}>
                                    <Plus size={16} /> Ajouter
                                </button>
                            </div>

                            {/* List */}
                            {blocks.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--light)', padding: '24px', fontSize: '14px' }}>Aucun blocage configuré</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {blocks.map((b, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                                            <Calendar size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>{fmt(b.startDate)} → {fmt(b.endDate)}</p>
                                                <p style={{ fontSize: '12px', color: 'var(--light)', margin: '2px 0 0' }}>{b.reason}</p>
                                            </div>
                                            <button onClick={() => setBlocks(prev => prev.filter((_, j) => j !== i))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SEASONAL PRICING ── */}
                    {tab === 'seasonal' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--light)', margin: 0 }}>
                                Prix de base : <strong style={{ color: 'var(--dark)' }}>{listing.pricing?.basePrice} {listing.pricing?.currency}/nuit</strong>
                            </p>

                            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
                                <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>Ajouter une période</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Début</label>
                                        <input type="date" className="input-field" value={newSeasonal.startDate}
                                            onChange={e => setNewSeasonal(p => ({ ...p, startDate: e.target.value }))}
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Fin</label>
                                        <input type="date" className="input-field" value={newSeasonal.endDate}
                                            min={newSeasonal.startDate}
                                            onChange={e => setNewSeasonal(p => ({ ...p, endDate: e.target.value }))}
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Prix/nuit ({listing.pricing?.currency})</label>
                                        <input type="number" className="input-field" value={newSeasonal.price || ''}
                                            onChange={e => setNewSeasonal(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                            min="1" placeholder="Ex: 150"
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--light)', display: 'block', marginBottom: '4px' }}>Label (optionnel)</label>
                                        <input type="text" className="input-field" value={newSeasonal.label}
                                            onChange={e => setNewSeasonal(p => ({ ...p, label: e.target.value }))}
                                            placeholder="Ex: Haute saison, Été..."
                                            style={{ marginBottom: 0 }} />
                                    </div>
                                </div>
                                <button onClick={addSeasonal} disabled={!newSeasonal.startDate || !newSeasonal.endDate || !newSeasonal.price}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', opacity: (!newSeasonal.startDate || !newSeasonal.endDate || !newSeasonal.price) ? 0.5 : 1 }}>
                                    <Plus size={16} /> Ajouter
                                </button>
                            </div>

                            {/* List */}
                            {seasonal.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--light)', padding: '24px', fontSize: '14px' }}>Aucun prix saisonnier configuré</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {seasonal.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                                            <TrendingUp size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>{fmt(s.startDate)} → {fmt(s.endDate)}</p>
                                                    {s.label && <span style={{ fontSize: '11px', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{s.label}</span>}
                                                </div>
                                                <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700', margin: '2px 0 0' }}>{s.price} {listing.pricing?.currency}/nuit</p>
                                            </div>
                                            <button onClick={() => setSeasonal(prev => prev.filter((_, j) => j !== i))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                        Fermer
                    </button>
                    <button
                        onClick={tab === 'details' ? saveDetails : (tab === 'blocks' ? saveBlocks : saveSeasonal)}
                        disabled={mutation.isPending}
                        style={{
                            padding: '10px 24px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            opacity: mutation.isPending ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>

            {showDiffModal && (
                <PendingChangesModal
                    listing={listing}
                    onClose={() => setShowDiffModal(false)}
                    onApprove={() => {
                        approvePendingMutation.mutate();
                        setShowDiffModal(false);
                    }}
                    onReject={() => {
                        if (window.confirm('Voulez-vous rejeter ces modifications ? L\'annonce conservera ses anciennes données.')) {
                            rejectPendingMutation.mutate();
                            setShowDiffModal(false);
                        }
                    }}
                    isApproving={approvePendingMutation.isPending}
                    isRejecting={rejectPendingMutation.isPending}
                />
            )}
        </>,
        document.body
    );
};

export default ListingEditPanel;
