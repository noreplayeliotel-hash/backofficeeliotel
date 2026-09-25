import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllReviews, deleteReview, updateUserStatus } from '../services/adminService';
import {
    Star,
    Trash2,
    Search,
    ExternalLink,
    Calendar,
    CheckCircle2,
    Clock,
    IdCard,
    UserX,
    UserCheck,
    Eye,
    X,
    Copy,
    Check,
    ShieldOff
} from 'lucide-react';
import ResponsiveDataView from '../components/ResponsiveDataView';

// Helper pour résoudre l'URL complète d'une image/document
const getMediaUrl = (path?: string | null): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};

// Formater le type de document officiel
const formatDocumentType = (type?: string | null): string => {
    if (!type) return 'Non spécifié';
    const t = type.toLowerCase();
    if (t === 'cin' || t.includes('cin') || t.includes('nationale')) return "Carte Nationale d'Identité (CIN)";
    if (t === 'passport' || t.includes('pass')) return 'Passeport';
    if (t === 'residence_permit' || t.includes('sejour') || t.includes('séjour')) return 'Titre de Séjour';
    return type.toUpperCase();
};

interface BookingReviewGroup {
    _id: string;
    bookingId: string;
    booking: any;
    listing: any;
    guestReview: any;
    hostReview: any;
    latestCreatedAt: Date;
}

const ReviewsPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'both' | 'guest_only' | 'host_only'>('all');
    const [selectedHostForDocs, setSelectedHostForDocs] = useState<any | null>(null);
    const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
    const [copiedDoc, setCopiedDoc] = useState(false);

    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['adminReviews', search],
        queryFn: () => getAllReviews({ search })
    });

    const deleteMutation = useMutation({
        mutationFn: (reviewId: string) => deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
        }
    });

    const blockMutation = useMutation({
        mutationFn: ({ userId, status }: { userId: string; status: string }) =>
            updateUserStatus(userId, status),
        onSuccess: (_data, { userId, status }) => {
            queryClient.setQueriesData({ queryKey: ['adminReviews'] }, (oldData: any) => {
                if (!oldData || !oldData.reviews) return oldData;
                return {
                    ...oldData,
                    reviews: oldData.reviews.map((rev: any) => {
                        const newRev = { ...rev };
                        if (newRev.reviewer && newRev.reviewer._id === userId) {
                            newRev.reviewer = { ...newRev.reviewer, status };
                        }
                        if (newRev.reviewee && newRev.reviewee._id === userId) {
                            newRev.reviewee = { ...newRev.reviewee, status };
                        }
                        if (newRev.listing?.host && newRev.listing.host._id === userId) {
                            newRev.listing = {
                                ...newRev.listing,
                                host: { ...newRev.listing.host, status }
                            };
                        }
                        if (newRev.booking?.guest && newRev.booking.guest._id === userId) {
                            newRev.booking = {
                                ...newRev.booking,
                                guest: { ...newRev.booking.guest, status }
                            };
                        }
                        if (newRev.booking?.host && newRev.booking.host._id === userId) {
                            newRev.booking = {
                                ...newRev.booking,
                                host: { ...newRev.booking.host, status }
                            };
                        }
                        if (newRev.hostReview?.reviewer && newRev.hostReview.reviewer._id === userId) {
                            newRev.hostReview = {
                                ...newRev.hostReview,
                                reviewer: { ...newRev.hostReview.reviewer, status }
                            };
                        }
                        return newRev;
                    })
                };
            });
            queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (err: any) => {
            alert(`Erreur lors de la mise à jour du statut : ${err.response?.data?.message || err.message}`);
        }
    });

    const rawReviews = data?.reviews || [];

    // Fonctions d'analyse d'identité
    const isIdentityVerified = (user: any): boolean => {
        if (!user) return false;
        const s = user.identityVerification?.status?.toLowerCase();
        return s === 'verified' || s === 'oui' || (user.role === 'host' && user.isVerified);
    };

    const isPendingVerification = (user: any): boolean => {
        if (!user) return false;
        const s = user.identityVerification?.status?.toLowerCase();
        return s === 'pending';
    };

    const canViewDocs = (user: any): boolean => {
        if (!user) return false;
        const iv = user.identityVerification;
        if (!iv) return false;
        const hasFront = !!(iv.idDocumentFront && String(iv.idDocumentFront).trim());
        const hasBack = !!(iv.idDocumentBack && String(iv.idDocumentBack).trim());
        const hasNum = !!(iv.idDocumentNumber && String(iv.idDocumentNumber).trim());
        return hasFront || hasBack || hasNum;
    };

    // Obtenir l'utilisateur Hôte d'une réservation/groupe
    const getHostUser = (group: BookingReviewGroup) => {
        if (group.hostReview?.reviewer && typeof group.hostReview.reviewer === 'object') {
            return group.hostReview.reviewer;
        }
        if (group.guestReview?.reviewee && typeof group.guestReview.reviewee === 'object') {
            return group.guestReview.reviewee;
        }
        if (group.listing?.host && typeof group.listing.host === 'object') {
            return group.listing.host;
        }
        if (group.booking?.host && typeof group.booking.host === 'object') {
            return group.booking.host;
        }
        return null;
    };

    // Obtenir le voyageur / rapporteur d'une réservation/groupe
    const getReporterUser = (group: BookingReviewGroup) => {
        if (group.guestReview?.reviewer && typeof group.guestReview.reviewer === 'object') {
            return group.guestReview.reviewer;
        }
        if (group.hostReview?.reviewee && typeof group.hostReview.reviewee === 'object') {
            return group.hostReview.reviewee;
        }
        if (group.booking?.guest && typeof group.booking.guest === 'object') {
            return group.booking.guest;
        }
        return null;
    };

    // Gestion du blocage / déblocage
    const handleToggleBlock = (user: any, roleLabel: string = "l'utilisateur") => {
        if (!user || !user._id) return;
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || roleLabel;
        const isSuspended = user.status === 'suspended';

        if (isSuspended) {
            if (window.confirm(`Confirmer le déblocage et la réactivation de ${name} (${roleLabel}) ?`)) {
                blockMutation.mutate({ userId: user._id, status: 'active' });
            }
        } else {
            if (window.confirm(`Êtes-vous sûr de vouloir bloquer / suspendre ${name} (${roleLabel}) ? Cet utilisateur ne pourra plus se connecter ni effectuer d'actions sur la plateforme.`)) {
                blockMutation.mutate({ userId: user._id, status: 'suspended' });
            }
        }
    };

    const handleCopyDocNumber = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedDoc(true);
        setTimeout(() => setCopiedDoc(false), 2000);
    };

    // Regrouper les avis du même booking sur une seule ligne
    const bookingGroups = useMemo(() => {
        const map = new Map<string, BookingReviewGroup>();

        rawReviews.forEach((review: any) => {
            const bId = (review.booking?._id || review.booking)?.toString() || `nobooking_${review._id}`;

            if (!map.has(bId)) {
                map.set(bId, {
                    _id: bId,
                    bookingId: bId,
                    booking: review.booking,
                    listing: review.listing,
                    guestReview: null,
                    hostReview: null,
                    latestCreatedAt: new Date(review.createdAt)
                });
            }

            const group = map.get(bId)!;

            if (!group.listing && review.listing) group.listing = review.listing;
            if (!group.booking && review.booking) group.booking = review.booking;

            const rDate = new Date(review.createdAt);
            if (rDate > group.latestCreatedAt) {
                group.latestCreatedAt = rDate;
            }

            if (review.reviewerRole === 'host') {
                group.hostReview = review;
            } else {
                group.guestReview = review;
                // Si l'hôte a déjà laissé un avis rattaché par le backend
                if (review.hostReview && !group.hostReview) {
                    group.hostReview = review.hostReview;
                }
            }
        });

        return Array.from(map.values()).sort(
            (a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime()
        );
    }, [rawReviews]);

    // Filtrage par statut et recherche texte
    const filteredGroups = useMemo(() => {
        return bookingGroups.filter((group) => {
            // Filtre par statut
            if (statusFilter === 'both' && (!group.guestReview || !group.hostReview)) return false;
            if (statusFilter === 'guest_only' && (!group.guestReview || group.hostReview)) return false;
            if (statusFilter === 'host_only' && (!group.hostReview || group.guestReview)) return false;

            // Filtre par recherche
            if (search.trim()) {
                const s = search.toLowerCase();
                const listingTitle = group.listing?.title?.toLowerCase() || '';
                const guestName = `${group.guestReview?.reviewer?.firstName || ''} ${group.guestReview?.reviewer?.lastName || ''}`.toLowerCase();
                const guestComment = group.guestReview?.comment?.toLowerCase() || '';
                const hostName = `${group.hostReview?.reviewer?.firstName || ''} ${group.hostReview?.reviewer?.lastName || ''}`.toLowerCase();
                const hostComment = group.hostReview?.comment?.toLowerCase() || '';

                return (
                    listingTitle.includes(s) ||
                    guestName.includes(s) ||
                    guestComment.includes(s) ||
                    hostName.includes(s) ||
                    hostComment.includes(s)
                );
            }

            return true;
        });
    }, [bookingGroups, statusFilter, search]);

    const bothCount = bookingGroups.filter(g => g.guestReview && g.hostReview).length;
    const guestOnlyCount = bookingGroups.filter(g => g.guestReview && !g.hostReview).length;
    const hostOnlyCount = bookingGroups.filter(g => !g.guestReview && g.hostReview).length;

    const confirmDelete = (reviewId: string, label: string = 'cet avis') => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${label} ? Cette action est irréversible.`)) {
            deleteMutation.mutate(reviewId);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return '';
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div style={{ display: 'flex', gap: '2px', color: '#FBBF24', alignItems: 'center' }}>
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        fill={i < Math.round(rating) ? '#FBBF24' : 'none'}
                        style={{ opacity: i < Math.round(rating) ? 1 : 0.3 }}
                    />
                ))}
                <span style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '4px', color: '#4B5563' }}>
                    {rating.toFixed(1)}
                </span>
            </div>
        );
    };

    if (isLoading) return <div style={{ padding: '24px' }}>Chargement des avis...</div>;

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Avis et Commentaires</h1>
                    <p style={{ color: 'var(--light)', marginTop: '4px' }}>
                        Consultez et modérez les avis réciproques, vérifiez l'identité des hôtes et gérez le blocage des comptes.
                    </p>
                </div>

                <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--light)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher par annonce, voyageur, hôte ou mot-clé..."
                            className="input-field"
                            style={{ paddingLeft: '40px', marginBottom: 0 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setStatusFilter('all')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600',
                                border: '1px solid',
                                borderColor: statusFilter === 'all' ? 'var(--primary, #008489)' : 'var(--border, #E5E7EB)',
                                backgroundColor: statusFilter === 'all' ? 'var(--primary, #008489)' : 'transparent',
                                color: statusFilter === 'all' ? '#FFF' : 'var(--dark, #374151)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Toutes les réservations ({bookingGroups.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('both')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600',
                                border: '1px solid',
                                borderColor: statusFilter === 'both' ? '#15803D' : 'var(--border, #E5E7EB)',
                                backgroundColor: statusFilter === 'both' ? '#DCFCE7' : 'transparent',
                                color: statusFilter === 'both' ? '#15803D' : 'var(--dark, #374151)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Avis mutuels complets ({bothCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('guest_only')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600',
                                border: '1px solid',
                                borderColor: statusFilter === 'guest_only' ? '#B45309' : 'var(--border, #E5E7EB)',
                                backgroundColor: statusFilter === 'guest_only' ? '#FEF3C7' : 'transparent',
                                color: statusFilter === 'guest_only' ? '#B45309' : 'var(--dark, #374151)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Avis voyageur seul ({guestOnlyCount})
                        </button>
                        <button
                            onClick={() => setStatusFilter('host_only')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600',
                                border: '1px solid',
                                borderColor: statusFilter === 'host_only' ? '#6D28D9' : 'var(--border, #E5E7EB)',
                                backgroundColor: statusFilter === 'host_only' ? '#EDE9FE' : 'transparent',
                                color: statusFilter === 'host_only' ? '#6D28D9' : 'var(--dark, #374151)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Avis hôte seul ({hostOnlyCount})
                        </button>
                    </div>
                </div>
            </div>

            <ResponsiveDataView
                data={filteredGroups}
                renderCard={(group: BookingReviewGroup) => {
                    const hostUser = getHostUser(group);
                    const reporterUser = getReporterUser(group);

                    return (
                        <div className="user-mobile-card">
                            {/* Header avec image de l'annonce et dates */}
                            <div className="mobile-card-header">
                                <img
                                    src={group.listing?.images?.[0]?.url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400'}
                                    alt=""
                                    className="mobile-card-image"
                                />
                                <div className="mobile-card-title-section">
                                    <h3 className="mobile-card-title">{group.listing?.title || 'Logement réservé'}</h3>
                                    {group.booking?.checkIn && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--light)', marginTop: '2px' }}>
                                            <Calendar size={11} />
                                            <span>{formatDate(group.booking.checkIn)} - {formatDate(group.booking.checkOut)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Body avec les deux avis côte à côte / empilés */}
                            <div className="mobile-card-body" style={{ gap: '12px' }}>
                                {/* Avis Voyageur / Rapporteur */}
                                <div style={{
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderLeft: '3px solid #3B82F6',
                                    borderRadius: '8px',
                                    padding: '10px 12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563EB', textTransform: 'uppercase' }}>
                                            Avis Voyageur / Rapporteur
                                        </span>
                                        {group.guestReview && renderStars(group.guestReview.rating)}
                                    </div>
                                    {group.guestReview ? (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--dark)' }}>
                                                    {reporterUser?.firstName || group.guestReview.reviewer?.firstName} {reporterUser?.lastName || group.guestReview.reviewer?.lastName}
                                                    {(reporterUser?.phone || group.guestReview.reviewer?.phone) && (
                                                        <span style={{ color: 'var(--light)', fontWeight: 'normal', marginLeft: '4px' }}>
                                                            ({reporterUser?.phone || group.guestReview.reviewer?.phone})
                                                        </span>
                                                    )}
                                                </div>
                                                {reporterUser?.status === 'suspended' && (
                                                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                        SUSPENDU
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: '12.5px', color: '#334155', fontStyle: 'italic', margin: '6px 0', lineHeight: '1.4' }}>
                                                "{group.guestReview.comment}"
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                                                <span style={{ fontSize: '10.5px', color: 'var(--light)' }}>
                                                    {formatDate(group.guestReview.createdAt)}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {reporterUser && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleBlock(reporterUser, 'le rapporteur')}
                                                            style={{
                                                                backgroundColor: reporterUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                                color: reporterUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                                border: `1px solid ${reporterUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                                borderRadius: '6px',
                                                                padding: '3px 8px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {reporterUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                            <span>{reporterUser.status === 'suspended' ? 'Débloquer' : 'Bloquer rapporteur'}</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => confirmDelete(group.guestReview._id, "l'avis du voyageur")}
                                                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
                                                    >
                                                        <Trash2 size={12} />
                                                        <span>Supprimer</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--light)', fontStyle: 'italic' }}>
                                                En attente de l'avis du voyageur
                                            </div>
                                            {reporterUser && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleBlock(reporterUser, 'le voyageur')}
                                                    style={{
                                                        backgroundColor: reporterUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                        color: reporterUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                        border: `1px solid ${reporterUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                        borderRadius: '6px',
                                                        padding: '3px 8px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {reporterUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                    <span>{reporterUser.status === 'suspended' ? 'Débloquer' : 'Bloquer voyageur'}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Avis Hôte */}
                                <div style={{
                                    backgroundColor: '#FDFCF8',
                                    border: '1px solid #FEF3C7',
                                    borderLeft: '3px solid #F59E0B',
                                    borderRadius: '8px',
                                    padding: '10px 12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#D97706', textTransform: 'uppercase' }}>
                                            Avis Hôte
                                        </span>
                                        {group.hostReview && renderStars(group.hostReview.rating)}
                                    </div>
                                    {group.hostReview ? (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--dark)' }}>
                                                    {hostUser?.firstName || group.hostReview.reviewer?.firstName} {hostUser?.lastName || group.hostReview.reviewer?.lastName}
                                                    {(hostUser?.phone || group.hostReview.reviewer?.phone) && (
                                                        <span style={{ color: 'var(--light)', fontWeight: 'normal', marginLeft: '4px' }}>
                                                            ({hostUser?.phone || group.hostReview.reviewer?.phone})
                                                        </span>
                                                    )}
                                                </div>
                                                {hostUser?.status === 'suspended' && (
                                                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                        SUSPENDU
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: '12.5px', color: '#334155', fontStyle: 'italic', margin: '6px 0', lineHeight: '1.4' }}>
                                                "{group.hostReview.comment}"
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                                                <span style={{ fontSize: '10.5px', color: 'var(--light)' }}>
                                                    {formatDate(group.hostReview.createdAt)}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                    {hostUser && canViewDocs(hostUser) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedHostForDocs(hostUser)}
                                                            style={{
                                                                backgroundColor: '#EFF6FF',
                                                                color: '#1D4ED8',
                                                                border: '1px solid #BFDBFE',
                                                                borderRadius: '6px',
                                                                padding: '3px 8px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <IdCard size={12} />
                                                            <span>Pièce d'identité</span>
                                                        </button>
                                                    )}
                                                    {hostUser && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleBlock(hostUser, "l'hôte")}
                                                            style={{
                                                                backgroundColor: hostUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                                color: hostUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                                border: `1px solid ${hostUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                                borderRadius: '6px',
                                                                padding: '3px 8px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {hostUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                            <span>{hostUser.status === 'suspended' ? 'Débloquer' : 'Bloquer hôte'}</span>
                                                        </button>
                                                    )}
                                                    {group.hostReview._id && (
                                                        <button
                                                            onClick={() => confirmDelete(group.hostReview._id, "l'avis de l'hôte")}
                                                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
                                                        >
                                                            <Trash2 size={12} />
                                                            <span>Supprimer</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--light)', fontStyle: 'italic' }}>
                                                {hostUser ? `En attente du commentaire de l'hôte (${hostUser.firstName || ''})` : "En attente du commentaire de l'hôte"}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {hostUser && canViewDocs(hostUser) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedHostForDocs(hostUser)}
                                                        style={{
                                                            backgroundColor: '#EFF6FF',
                                                            color: '#1D4ED8',
                                                            border: '1px solid #BFDBFE',
                                                            borderRadius: '6px',
                                                            padding: '3px 8px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <IdCard size={12} />
                                                        <span>Pièce d'identité</span>
                                                    </button>
                                                )}
                                                {hostUser && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleBlock(hostUser, "l'hôte")}
                                                        style={{
                                                            backgroundColor: hostUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                            color: hostUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                            border: `1px solid ${hostUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                            borderRadius: '6px',
                                                            padding: '3px 8px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {hostUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                        <span>{hostUser.status === 'suspended' ? 'Débloquer' : 'Bloquer hôte'}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer avec Statut & Actions */}
                            <div className="mobile-card-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                {group.guestReview && group.hostReview ? (
                                    <span style={{
                                        fontSize: '11px',
                                        padding: '4px 8px',
                                        backgroundColor: '#DCFCE7',
                                        color: '#15803D',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <CheckCircle2 size={12} />
                                        Avis mutuels publiés
                                    </span>
                                ) : (
                                    <span style={{
                                        fontSize: '11px',
                                        padding: '4px 8px',
                                        backgroundColor: '#FEF3C7',
                                        color: '#B45309',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Clock size={12} />
                                        Partiel
                                    </span>
                                )}

                                {group.listing?._id && (
                                    <button
                                        onClick={() => window.open(`/listings/${group.listing._id}`, '_blank')}
                                        className="mobile-card-action-btn"
                                        style={{
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--dark)',
                                            borderColor: 'var(--border)'
                                        }}
                                    >
                                        <ExternalLink size={16} />
                                        <span>Voir l'annonce</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }}
                renderTable={() => (
                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '22%' }}>Annonce & Séjour</th>
                                        <th style={{ width: '33%' }}>Avis du Voyageur / Rapporteur</th>
                                        <th style={{ width: '33%' }}>Avis & Identité de l'Hôte</th>
                                        <th style={{ width: '12%', textAlign: 'center' }}>Statut & Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGroups.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--light)' }}>
                                                Aucune réservation avec avis trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredGroups.map((group: BookingReviewGroup) => {
                                            const hostUser = getHostUser(group);
                                            const reporterUser = getReporterUser(group);

                                            return (
                                                <tr key={group._id} style={{ verticalAlign: 'top' }}>
                                                    {/* Colonne 1 : Annonce & Séjour */}
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                                                                    <img
                                                                        src={group.listing?.images?.[0]?.url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400'}
                                                                        alt=""
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                                    <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--dark)', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {group.listing?.title || 'Logement réservé'}
                                                                    </span>
                                                                    {group.bookingId && !group.bookingId.startsWith('nobooking') && (
                                                                        <span style={{ fontSize: '11px', color: 'var(--light)', fontFamily: 'monospace' }}>
                                                                            #{group.bookingId.slice(-6).toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {group.booking?.checkIn && (
                                                                <div style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    fontSize: '11.5px',
                                                                    color: '#4B5563',
                                                                    backgroundColor: '#F3F4F6',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '6px',
                                                                    width: 'fit-content'
                                                                }}>
                                                                    <Calendar size={12} color="#6B7280" />
                                                                    <span>
                                                                        {formatDate(group.booking.checkIn)} - {formatDate(group.booking.checkOut)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Colonne 2 : Avis Voyageur / Rapporteur */}
                                                    <td>
                                                        {group.guestReview ? (
                                                            <div style={{
                                                                backgroundColor: '#F8FAFC',
                                                                border: '1px solid #E2E8F0',
                                                                borderLeft: '3px solid #3B82F6',
                                                                borderRadius: '8px',
                                                                padding: '10px 12px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '6px'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563EB', textTransform: 'uppercase', marginRight: '4px' }}>
                                                                            Voyageur
                                                                        </span>
                                                                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dark)' }}>
                                                                            {reporterUser?.firstName || group.guestReview.reviewer?.firstName} {reporterUser?.lastName || group.guestReview.reviewer?.lastName}
                                                                        </span>
                                                                        {(reporterUser?.phone || group.guestReview.reviewer?.phone) && (
                                                                            <span style={{ fontSize: '11px', color: 'var(--light)', marginLeft: '4px' }}>
                                                                                ({reporterUser?.phone || group.guestReview.reviewer?.phone})
                                                                            </span>
                                                                        )}
                                                                        {reporterUser?.status === 'suspended' && (
                                                                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                                                SUSPENDU
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {renderStars(group.guestReview.rating)}
                                                                </div>

                                                                <p style={{
                                                                    fontSize: '13px',
                                                                    color: '#1E293B',
                                                                    fontStyle: 'italic',
                                                                    lineHeight: '1.45',
                                                                    margin: '2px 0'
                                                                }}>
                                                                    "{group.guestReview.comment}"
                                                                </p>

                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                                                                    <span style={{ fontSize: '11px', color: 'var(--light)' }}>
                                                                        {formatDate(group.guestReview.createdAt)}
                                                                    </span>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        {reporterUser && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleToggleBlock(reporterUser, 'le rapporteur')}
                                                                                title={reporterUser.status === 'suspended' ? 'Débloquer ce rapporteur' : 'Bloquer ce rapporteur'}
                                                                                style={{
                                                                                    backgroundColor: reporterUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                                                    color: reporterUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                                                    border: `1px solid ${reporterUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                                                    borderRadius: '6px',
                                                                                    padding: '3px 8px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '600',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                {reporterUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                                                <span>{reporterUser.status === 'suspended' ? 'Débloquer' : 'Bloquer rapporteur'}</span>
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => confirmDelete(group.guestReview._id, "l'avis du voyageur")}
                                                                            title="Supprimer cet avis voyageur"
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                color: 'var(--error)',
                                                                                cursor: 'pointer',
                                                                                padding: '2px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '2px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '500'
                                                                            }}
                                                                        >
                                                                            <Trash2 size={13} />
                                                                            <span>Supprimer</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{
                                                                padding: '12px',
                                                                backgroundColor: '#F9FAFB',
                                                                border: '1px dashed #D1D5DB',
                                                                borderRadius: '8px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                gap: '8px',
                                                                flexWrap: 'wrap'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--light)', fontSize: '12px' }}>
                                                                    <Clock size={16} />
                                                                    <span>Aucun avis laissé par le voyageur</span>
                                                                </div>
                                                                {reporterUser && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleBlock(reporterUser, 'le voyageur')}
                                                                        style={{
                                                                            backgroundColor: reporterUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                                            color: reporterUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                                            border: `1px solid ${reporterUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                                            borderRadius: '6px',
                                                                            padding: '3px 8px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        {reporterUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                                        <span>{reporterUser.status === 'suspended' ? 'Débloquer' : 'Bloquer voyageur'}</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Colonne 3 : Avis & Identité de l'Hôte */}
                                                    <td>
                                                        {group.hostReview ? (
                                                            <div style={{
                                                                backgroundColor: '#FDFCF8',
                                                                border: '1px solid #FEF3C7',
                                                                borderLeft: '3px solid #F59E0B',
                                                                borderRadius: '8px',
                                                                padding: '10px 12px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '6px'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#D97706', textTransform: 'uppercase', marginRight: '4px' }}>
                                                                            Hôte
                                                                        </span>
                                                                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dark)' }}>
                                                                            {hostUser?.firstName || group.hostReview.reviewer?.firstName} {hostUser?.lastName || group.hostReview.reviewer?.lastName}
                                                                        </span>
                                                                        {(hostUser?.phone || group.hostReview.reviewer?.phone) && (
                                                                            <span style={{ fontSize: '11px', color: 'var(--light)', marginLeft: '4px' }}>
                                                                                ({hostUser?.phone || group.hostReview.reviewer?.phone})
                                                                            </span>
                                                                        )}
                                                                        {hostUser?.status === 'suspended' && (
                                                                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                                                SUSPENDU
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {renderStars(group.hostReview.rating)}
                                                                </div>

                                                                <p style={{
                                                                    fontSize: '13px',
                                                                    color: '#1E293B',
                                                                    fontStyle: 'italic',
                                                                    lineHeight: '1.45',
                                                                    margin: '2px 0'
                                                                }}>
                                                                    "{group.hostReview.comment}"
                                                                </p>

                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                                                                    <span style={{ fontSize: '11px', color: 'var(--light)' }}>
                                                                        {formatDate(group.hostReview.createdAt)}
                                                                    </span>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                        {hostUser && canViewDocs(hostUser) && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setSelectedHostForDocs(hostUser)}
                                                                                title="Voir les pièces d'identité officielles de l'hôte"
                                                                                style={{
                                                                                    backgroundColor: '#EFF6FF',
                                                                                    color: '#1D4ED8',
                                                                                    border: '1px solid #BFDBFE',
                                                                                    borderRadius: '6px',
                                                                                    padding: '3px 8px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '600',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                <IdCard size={12} />
                                                                                <span>Pièce d'identité</span>
                                                                            </button>
                                                                        )}
                                                                        {hostUser && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleToggleBlock(hostUser, "l'hôte")}
                                                                                title={hostUser.status === 'suspended' ? "Débloquer cet hôte" : "Bloquer cet hôte"}
                                                                                style={{
                                                                                    backgroundColor: hostUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                                                    color: hostUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                                                    border: `1px solid ${hostUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                                                    borderRadius: '6px',
                                                                                    padding: '3px 8px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '600',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                {hostUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                                                <span>{hostUser.status === 'suspended' ? 'Débloquer' : 'Bloquer hôte'}</span>
                                                                            </button>
                                                                        )}
                                                                        {group.hostReview._id && (
                                                                            <button
                                                                                onClick={() => confirmDelete(group.hostReview._id, "l'avis de l'hôte")}
                                                                                title="Supprimer cet avis de l'hôte"
                                                                                style={{
                                                                                    background: 'none',
                                                                                    border: 'none',
                                                                                    color: 'var(--error)',
                                                                                    cursor: 'pointer',
                                                                                    padding: '2px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '2px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '500'
                                                                                }}
                                                                            >
                                                                                <Trash2 size={13} />
                                                                                <span>Supprimer</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{
                                                                padding: '12px',
                                                                backgroundColor: '#F9FAFB',
                                                                border: '1px dashed #D1D5DB',
                                                                borderRadius: '8px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '8px'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <Clock size={16} color="var(--light)" />
                                                                        <span style={{ fontSize: '12px', color: 'var(--light)', fontStyle: 'italic' }}>
                                                                            {hostUser ? `Aucun avis laissé par l'hôte (${hostUser.firstName || ''} ${hostUser.lastName || ''})` : "Aucun avis laissé par l'hôte"}
                                                                        </span>
                                                                        {hostUser?.status === 'suspended' && (
                                                                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                                                SUSPENDU
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        {hostUser && canViewDocs(hostUser) && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setSelectedHostForDocs(hostUser)}
                                                                                title="Voir les pièces d'identité officielles de l'hôte"
                                                                                style={{
                                                                                    backgroundColor: '#EFF6FF',
                                                                                    color: '#1D4ED8',
                                                                                    border: '1px solid #BFDBFE',
                                                                                    borderRadius: '6px',
                                                                                    padding: '3px 8px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '600',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                <IdCard size={12} />
                                                                                <span>Pièce d'identité</span>
                                                                            </button>
                                                                        )}
                                                                        {hostUser && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleToggleBlock(hostUser, "l'hôte")}
                                                                                style={{
                                                                                    backgroundColor: hostUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                                                    color: hostUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                                                    border: `1px solid ${hostUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                                                    borderRadius: '6px',
                                                                                    padding: '3px 8px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '600',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                {hostUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                                                <span>{hostUser.status === 'suspended' ? 'Débloquer' : 'Bloquer hôte'}</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Colonne 4 : Statut & Actions */}
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                            {group.guestReview && group.hostReview ? (
                                                                <span style={{
                                                                    fontSize: '11px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#DCFCE7',
                                                                    color: '#15803D',
                                                                    borderRadius: '12px',
                                                                    fontWeight: '600',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    <CheckCircle2 size={12} />
                                                                    Avis mutuels
                                                                </span>
                                                            ) : group.guestReview ? (
                                                                <span style={{
                                                                    fontSize: '11px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#FEF3C7',
                                                                    color: '#B45309',
                                                                    borderRadius: '12px',
                                                                    fontWeight: '600',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    <Clock size={12} />
                                                                    Attente hôte
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    fontSize: '11px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#EDE9FE',
                                                                    color: '#6D28D9',
                                                                    borderRadius: '12px',
                                                                    fontWeight: '600',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    <Clock size={12} />
                                                                    Attente voyageur
                                                                </span>
                                                            )}

                                                            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                                                {group.listing?._id && (
                                                                    <button
                                                                        onClick={() => window.open(`/listings/${group.listing._id}`, '_blank')}
                                                                        className="btn"
                                                                        style={{
                                                                            padding: '6px 8px',
                                                                            backgroundColor: 'var(--surface)',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid var(--border)',
                                                                            color: 'var(--dark)',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px',
                                                                            fontSize: '11px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="Voir l'annonce"
                                                                    >
                                                                        <ExternalLink size={13} />
                                                                        <span>Annonce</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            />

            {/* MODALE VISUALISATION PIÈCE D'IDENTITÉ HÔTE - VIA PORTAL POUR FLUIDITÉ MOBILE */}
            {selectedHostForDocs && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => setSelectedHostForDocs(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            maxWidth: '750px',
                            width: '100%',
                            maxHeight: '92vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            border: '1px solid #E2E8F0'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modale */}
                        <div style={{
                            padding: '18px 22px',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#F8FAFC'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    backgroundColor: '#EFF6FF',
                                    color: '#2563EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <IdCard size={22} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                                            Pièce d'identité - {selectedHostForDocs.fullName || `${selectedHostForDocs.firstName || ''} ${selectedHostForDocs.lastName || ''}`}
                                        </h2>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: '#F5F3FF',
                                            color: '#6D28D9',
                                            border: '1px solid #DDD6FE'
                                        }}>
                                            HÔTE
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', margin: 0 }}>
                                        {selectedHostForDocs.email} • Téléphone : {selectedHostForDocs.phone || 'Non renseigné'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedHostForDocs(null)}
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '8px',
                                    backgroundColor: '#F1F5F9',
                                    color: '#475569',
                                    border: '1px solid #E2E8F0',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Contenu Défilable */}
                        <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {/* Fiche d'information officielle */}
                            <div style={{
                                padding: '14px 18px',
                                borderRadius: '12px',
                                backgroundColor: isIdentityVerified(selectedHostForDocs) ? '#F0FDF4' : '#FFFBEB',
                                border: isIdentityVerified(selectedHostForDocs) ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '14px'
                            }}>
                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Statut de Conformité</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                        {isIdentityVerified(selectedHostForDocs) ? (
                                            <>
                                                <CheckCircle2 size={16} color="#059669" />
                                                <strong style={{ color: '#059669', fontSize: '14px' }}>Validé & Conforme</strong>
                                            </>
                                        ) : isPendingVerification(selectedHostForDocs) ? (
                                            <>
                                                <Clock size={16} color="#D97706" />
                                                <strong style={{ color: '#D97706', fontSize: '14px' }}>En attente de contrôle</strong>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldOff size={16} color="#64748B" />
                                                <strong style={{ color: '#64748B', fontSize: '14px' }}>Non validé</strong>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Document Officiel</span>
                                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginTop: '4px' }}>
                                        {formatDocumentType(selectedHostForDocs.identityVerification?.idDocumentType)}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Numéro de Document</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>
                                            {selectedHostForDocs.identityVerification?.idDocumentNumber || 'Non renseigné'}
                                        </span>
                                        {selectedHostForDocs.identityVerification?.idDocumentNumber && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopyDocNumber(selectedHostForDocs.identityVerification!.idDocumentNumber!)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: copiedDoc ? '#059669' : '#64748B',
                                                    padding: '2px'
                                                }}
                                                title="Copier le numéro"
                                            >
                                                {copiedDoc ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {selectedHostForDocs.identityVerification?.verifiedAt && (
                                    <div>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Date de Validation</span>
                                        <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px', fontWeight: '500' }}>
                                            {new Date(selectedHostForDocs.identityVerification.verifiedAt).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section Recto et Verso Uniquement (Sans Selfie) */}
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0F172A' }}>
                                    Aperçu des pièces d'identité officielles de l'hôte
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                    {/* 1. Recto de la pièce d'identité */}
                                    <div style={{
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        backgroundColor: '#F8FAFC'
                                    }}>
                                        <div style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Recto de la pièce</span>
                                            {selectedHostForDocs.identityVerification?.idDocumentFront && (
                                                <button
                                                    type="button"
                                                    onClick={() => setZoomImage({
                                                        url: getMediaUrl(selectedHostForDocs.identityVerification?.idDocumentFront),
                                                        title: `Recto de la pièce - ${selectedHostForDocs.fullName || selectedHostForDocs.firstName}`
                                                    })}
                                                    style={{ background: 'transparent', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                                >
                                                    <Eye size={14} /> Agrandir
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            {selectedHostForDocs.identityVerification?.idDocumentFront ? (
                                                <img
                                                    src={getMediaUrl(selectedHostForDocs.identityVerification.idDocumentFront)}
                                                    alt="Recto de la pièce"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', backgroundColor: '#F1F5F9' }}
                                                    onClick={() => setZoomImage({
                                                        url: getMediaUrl(selectedHostForDocs.identityVerification?.idDocumentFront),
                                                        title: `Recto de la pièce - ${selectedHostForDocs.fullName || selectedHostForDocs.firstName}`
                                                    })}
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>
                                                    <IdCard size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                                    <p style={{ fontSize: '13px', fontWeight: '500' }}>Recto non téléversé</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Verso de la pièce d'identité */}
                                    <div style={{
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        backgroundColor: '#F8FAFC'
                                    }}>
                                        <div style={{ padding: '10px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                                                Verso {selectedHostForDocs.identityVerification?.idDocumentType === 'passport' ? '(Non requis pour Passeport)' : 'de la pièce'}
                                            </span>
                                            {selectedHostForDocs.identityVerification?.idDocumentBack && (
                                                <button
                                                    type="button"
                                                    onClick={() => setZoomImage({
                                                        url: getMediaUrl(selectedHostForDocs.identityVerification?.idDocumentBack),
                                                        title: `Verso de la pièce - ${selectedHostForDocs.fullName || selectedHostForDocs.firstName}`
                                                    })}
                                                    style={{ background: 'transparent', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                                >
                                                    <Eye size={14} /> Agrandir
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            {selectedHostForDocs.identityVerification?.idDocumentBack ? (
                                                <img
                                                    src={getMediaUrl(selectedHostForDocs.identityVerification.idDocumentBack)}
                                                    alt="Verso de la pièce"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', backgroundColor: '#F1F5F9' }}
                                                    onClick={() => setZoomImage({
                                                        url: getMediaUrl(selectedHostForDocs.identityVerification?.idDocumentBack),
                                                        title: `Verso de la pièce - ${selectedHostForDocs.fullName || selectedHostForDocs.firstName}`
                                                    })}
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>
                                                    <IdCard size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                                    <p style={{ fontSize: '13px', fontWeight: '500' }}>
                                                        {selectedHostForDocs.identityVerification?.idDocumentType === 'passport'
                                                            ? 'Verso non exigé pour un Passeport'
                                                            : 'Verso non téléversé'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Modale */}
                        <div style={{
                            padding: '14px 22px',
                            borderTop: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            backgroundColor: '#F8FAFC'
                        }}>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setSelectedHostForDocs(null)}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    backgroundColor: '#0F172A',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* LIGHTBOX / ZOOM PLEIN ÉCRAN - VIA PORTAL */}
            {zoomImage && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        zIndex: 100000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={() => setZoomImage(null)}
                >
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        right: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: 'white'
                    }}>
                        <span style={{ fontSize: '15px', fontWeight: '600' }}>{zoomImage.title}</span>
                        <button
                            type="button"
                            onClick={() => setZoomImage(null)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '38px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <img
                        src={zoomImage.url}
                        alt="Zoom document"
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '82vh',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};

export default ReviewsPage;
