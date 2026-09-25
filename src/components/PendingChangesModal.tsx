import React, { useState } from 'react';
import type { Listing } from '../types';
import {
    X, Check, AlertTriangle, ArrowRight, Home, DollarSign,
    MapPin, Users, Sparkles, Image as ImageIcon, Shield, Clock
} from 'lucide-react';
import { computeListingDiff } from '../utils/listingDiff';

interface PendingChangesModalProps {
    listing: Listing;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
    onOpenFullEdit?: () => void;
    isApproving?: boolean;
    isRejecting?: boolean;
}

interface DiffItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    oldValue: React.ReactNode;
    newValue: React.ReactNode;
    hasChanged: boolean;
}

export const PendingChangesModal: React.FC<PendingChangesModalProps> = ({
    listing,
    onClose,
    onApprove,
    onReject,
    onOpenFullEdit,
    isApproving = false,
    isRejecting = false
}) => {
    const edits = (listing as any).pendingEdit || {};
    const diffResult = computeListingDiff(listing);
    const [onlyChanged, setOnlyChanged] = useState(true);

    const diffs: DiffItem[] = [];

    // 1. Titre
    if (edits.title !== undefined) {
        diffs.push({
            id: 'title',
            label: 'Titre de l\'annonce',
            icon: <Home size={16} color="#d97706" />,
            oldValue: listing.title,
            newValue: edits.title,
            hasChanged: diffResult.diffs.title?.hasChanged ?? false
        });
    }

    // 2. Prix de base
    const oldPrice = listing.pricing?.basePrice;
    const newPrice = edits.pricing?.basePrice ?? edits.basePrice;
    const currency = edits.pricing?.currency || listing.pricing?.currency || 'EUR';
    if (newPrice !== undefined) {
        diffs.push({
            id: 'price',
            label: 'Prix par nuit',
            icon: <DollarSign size={16} color="#059669" />,
            oldValue: `${oldPrice} ${currency}`,
            newValue: `${newPrice} ${currency}`,
            hasChanged: diffResult.diffs.basePrice?.hasChanged ?? false
        });
    }

    // 3. Description
    if (edits.description !== undefined) {
        diffs.push({
            id: 'description',
            label: 'Description',
            icon: <Sparkles size={16} color="#4f46e5" />,
            oldValue: (
                <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '12px', whiteSpace: 'pre-line' }}>
                    {listing.description || 'Non renseignée'}
                </div>
            ),
            newValue: (
                <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '12px', whiteSpace: 'pre-line', fontWeight: 600 }}>
                    {edits.description || 'Non renseignée'}
                </div>
            ),
            hasChanged: diffResult.diffs.description?.hasChanged ?? false
        });
    }

    // 4. Type de propriété & Type de chambre
    if (edits.propertyType !== undefined || edits.roomType !== undefined) {
        const oldProp = `${listing.propertyType || ''} (${listing.roomType || ''})`;
        const newProp = `${edits.propertyType || listing.propertyType || ''} (${edits.roomType || listing.roomType || ''})`;
        diffs.push({
            id: 'type',
            label: 'Type de logement',
            icon: <Home size={16} color="#2563eb" />,
            oldValue: oldProp,
            newValue: newProp,
            hasChanged: Boolean(diffResult.diffs.propertyType?.hasChanged || diffResult.diffs.roomType?.hasChanged)
        });
    }

    // 5. Capacité (voyageurs, chambres, lits, salles de bain)
    if (edits.capacity) {
        const oldCap = `${listing.capacity?.guests ?? 0} voy. · ${listing.capacity?.bedrooms ?? 0} ch. · ${listing.capacity?.beds ?? 0} lits · ${listing.capacity?.bathrooms ?? 0} sdb`;
        const newCap = `${edits.capacity.guests ?? listing.capacity?.guests ?? 0} voy. · ${edits.capacity.bedrooms ?? listing.capacity?.bedrooms ?? 0} ch. · ${edits.capacity.beds ?? listing.capacity?.beds ?? 0} lits · ${edits.capacity.bathrooms ?? listing.capacity?.bathrooms ?? 0} sdb`;
        diffs.push({
            id: 'capacity',
            label: 'Capacité d\'accueil',
            icon: <Users size={16} color="#9333ea" />,
            oldValue: oldCap,
            newValue: newCap,
            hasChanged: diffResult.diffs.capacity?.hasChanged ?? false
        });
    }

    // 6. Adresse & Localisation
    if (edits.address || edits.location) {
        const oldAddr = `${listing.address?.street || ''}, ${listing.address?.city || ''} (${listing.address?.country || ''})`.replace(/^, /, '');
        const newAddr = `${edits.address?.street || listing.address?.street || ''}, ${edits.address?.city || listing.address?.city || ''} (${edits.address?.country || listing.address?.country || ''})`.replace(/^, /, '');
        diffs.push({
            id: 'address',
            label: 'Adresse & Localisation',
            icon: <MapPin size={16} color="#e11d48" />,
            oldValue: oldAddr || 'Non renseignée',
            newValue: newAddr || 'Non renseignée',
            hasChanged: diffResult.diffs.address?.hasChanged ?? false
        });
    }

    // 7. Politique d'annulation
    if (edits.cancellationPolicy !== undefined) {
        diffs.push({
            id: 'cancellationPolicy',
            label: 'Politique d\'annulation',
            icon: <Shield size={16} color="#d97706" />,
            oldValue: (listing as any).cancellationPolicy || 'flexible',
            newValue: edits.cancellationPolicy,
            hasChanged: diffResult.diffs.cancellationPolicy?.hasChanged ?? false
        });
    }

    // 8. Équipements
    if (edits.amenities && Array.isArray(edits.amenities)) {
        const oldAmenities = (listing as any).amenities || [];
        const newAmenities = edits.amenities;
        const added = newAmenities.filter((a: string) => !oldAmenities.includes(a));
        const removed = oldAmenities.filter((a: string) => !newAmenities.includes(a));

        diffs.push({
            id: 'amenities',
            label: 'Équipements',
            icon: <Sparkles size={16} color="#0d9488" />,
            oldValue: `${oldAmenities.length} équipements (${oldAmenities.slice(0, 4).join(', ')}${oldAmenities.length > 4 ? '...' : ''})`,
            newValue: (
                <div>
                    <div>{newAmenities.length} équipements</div>
                    {added.length > 0 && (
                        <div style={{ color: '#16a34a', fontSize: '11px', marginTop: '2px' }}>
                            + Ajoutés : {added.join(', ')}
                        </div>
                    )}
                    {removed.length > 0 && (
                        <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '2px' }}>
                            - Retirés : {removed.join(', ')}
                        </div>
                    )}
                </div>
            ),
            hasChanged: diffResult.diffs.amenities?.hasChanged ?? false
        });
    }

    // 9. Photos
    if (edits.images && Array.isArray(edits.images)) {
        const oldPhotosCount = listing.images?.length || 0;
        const newPhotosCount = edits.images.length;

        diffs.push({
            id: 'images',
            label: 'Galerie Photos',
            icon: <ImageIcon size={16} color="#3b82f6" />,
            oldValue: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {listing.images?.[0]?.url && (
                        <img src={listing.images[0].url} alt="" style={{ width: '42px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                    )}
                    <span>{oldPhotosCount} photos actuelles</span>
                </div>
            ),
            newValue: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {edits.images?.[0]?.url && (
                        <img src={edits.images[0].url} alt="" style={{ width: '42px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '2px solid #16a34a' }} />
                    )}
                    <span style={{ fontWeight: 600 }}>{newPhotosCount} photos proposées</span>
                </div>
            ),
            hasChanged: diffResult.diffs.images?.hasChanged ?? false
        });
    }

    // 10. Règles de la maison
    if (edits.houseRules) {
        const oldRules = (listing as any).houseRules || {};
        const newRules = edits.houseRules;
        const oldSummary = `Arrivée: ${oldRules.checkIn || '15:00'} · Départ: ${oldRules.checkOut || '11:00'} · Animaux: ${oldRules.petsAllowed ? 'Oui' : 'Non'} · Fumeur: ${oldRules.smokingAllowed ? 'Oui' : 'Non'}`;
        const newSummary = `Arrivée: ${newRules.checkIn || oldRules.checkIn || '15:00'} · Départ: ${newRules.checkOut || oldRules.checkOut || '11:00'} · Animaux: ${newRules.petsAllowed ? 'Oui' : 'Non'} · Fumeur: ${newRules.smokingAllowed ? 'Oui' : 'Non'}`;

        diffs.push({
            id: 'houseRules',
            label: 'Règles de la maison',
            icon: <Clock size={16} color="#4b5563" />,
            oldValue: oldSummary,
            newValue: newSummary,
            hasChanged: diffResult.diffs.houseRules?.hasChanged ?? false
        });
    }

    const changedDiffs = diffs.filter(d => d.hasChanged);
    const displayedDiffs = onlyChanged ? changedDiffs : diffs;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '840px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                overflow: 'hidden'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    backgroundColor: '#FFFBEB'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                backgroundColor: '#FDE68A',
                                color: '#92400E',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <AlertTriangle size={13} /> {changedDiffs.length} modification{changedDiffs.length > 1 ? 's' : ''} détectée{changedDiffs.length > 1 ? 's' : ''}
                            </span>
                            {edits.submittedAt && (
                                <span style={{ fontSize: '12px', color: '#78350F' }}>
                                    Soumis le {new Date(edits.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                        <h2 style={{ margin: '8px 0 2px', fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>
                            Changements proposés pour : {listing.title}
                        </h2>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#6B7280' }}>
                            {typeof listing.host === 'object' && `Hôte : ${listing.host.firstName} ${listing.host.lastName} · `}
                            L'annonce en ligne reste avec ses anciennes données jusqu'à validation.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6B7280',
                            padding: '6px',
                            borderRadius: '8px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filter toggle */}
                <div style={{
                    padding: '10px 24px',
                    borderBottom: '1px solid #F3F4F6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FAFAFA'
                }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }}>
                        Comparatif : Ancienne version (En ligne) vs Nouvelle version (Demandée)
                    </span>
                    <button
                        onClick={() => setOnlyChanged(!onlyChanged)}
                        style={{
                            background: 'none',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            color: '#4B5563',
                            fontWeight: 500
                        }}
                    >
                        {onlyChanged ? `Afficher tous les champs (${diffs.length})` : `Afficher uniquement les changements (${changedDiffs.length})`}
                    </button>
                </div>

                {/* Modal Body: Comparison Table */}
                <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                    {displayedDiffs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                            <p style={{ fontSize: '15px', fontWeight: 600 }}>Aucune modification détectée dans les données soumises.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {displayedDiffs.map((diff) => (
                                <div
                                    key={diff.id}
                                    style={{
                                        border: diff.hasChanged ? '1.5px solid #FCD34D' : '1px solid #E5E7EB',
                                        backgroundColor: diff.hasChanged ? '#FFFDF5' : 'white',
                                        borderRadius: '12px',
                                        padding: '14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#1F2937' }}>
                                            {diff.icon}
                                            <span>{diff.label}</span>
                                        </div>
                                        {diff.hasChanged ? (
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: '#B45309',
                                                backgroundColor: '#FEF3C7',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid #FCD34D'
                                            }}>
                                                MODIFIÉ
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Identique</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
                                        {/* Ancienne valeur */}
                                        <div style={{
                                            backgroundColor: '#F9FAFB',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            padding: '10px 12px',
                                            color: '#4B5563',
                                            fontSize: '13px'
                                        }}>
                                            <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: '#9CA3AF', marginBottom: '4px' }}>
                                                Actuelle (En ligne)
                                            </div>
                                            <div>{diff.oldValue}</div>
                                        </div>

                                        <ArrowRight size={16} color={diff.hasChanged ? '#D97706' : '#9CA3AF'} style={{ flexShrink: 0 }} />

                                        {/* Nouvelle valeur */}
                                        <div style={{
                                            backgroundColor: diff.hasChanged ? '#F0FDF4' : '#F9FAFB',
                                            border: diff.hasChanged ? '1.5px solid #86EFAC' : '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            padding: '10px 12px',
                                            color: diff.hasChanged ? '#15803D' : '#4B5563',
                                            fontSize: '13px',
                                            fontWeight: diff.hasChanged ? 600 : 400
                                        }}>
                                            <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: diff.hasChanged ? '#16A34A' : '#9CA3AF', marginBottom: '4px' }}>
                                                Nouvelle demandée
                                            </div>
                                            <div>{diff.newValue}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Footer: Action buttons */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div>
                        {onOpenFullEdit && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenFullEdit();
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#4338CA',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Ouvrir l'éditeur complet pour ajuster
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onReject}
                            disabled={isRejecting || isApproving}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '9px 16px',
                                backgroundColor: '#FEE2E2',
                                color: '#991B1B',
                                border: '1px solid #FCA5A5',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <X size={15} /> {isRejecting ? 'Rejet en cours...' : 'Rejeter les modifications'}
                        </button>

                        <button
                            onClick={onApprove}
                            disabled={isApproving || isRejecting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '9px 18px',
                                backgroundColor: '#16A34A',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                            }}
                        >
                            <Check size={16} /> {isApproving ? 'Publication...' : 'Approuver et publier'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
