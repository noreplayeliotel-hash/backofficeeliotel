import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, updateUserStatus, updateUserVerification } from '../services/adminService';
import type { User } from '../types';
import {
    Shield,
    ShieldCheck,
    ShieldAlert,
    ShieldOff,
    Search,
    Eye,
    X,
    Clock,
    UserCheck,
    UserX,
    Users as UsersIcon,
    ExternalLink,
    Copy,
    Check,
    IdCard,
    FileCheck,
    Building2,
    Calendar,
    Phone,
    Mail,
    CheckCircle2
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

type FilterType = 'all' | 'verified_hosts' | 'unverified_guests' | 'pending' | 'all_hosts' | 'all_guests';

const UsersPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedUserForDocs, setSelectedUserForDocs] = useState<User | null>(null);
    const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
    const [copiedDoc, setCopiedDoc] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['adminUsers', search],
        queryFn: () => getAllUsers({ search })
    });

    const mutation = useMutation({
        mutationFn: ({ userId, status }: { userId: string, status: string }) =>
            updateUserStatus(userId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        }
    });

    const verifyMutation = useMutation({
        mutationFn: ({ userId, isVerified }: { userId: string, isVerified: boolean }) =>
            updateUserVerification(userId, isVerified),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (err: any) => {
            alert(`Erreur : ${err.response?.data?.message || err.message}`);
        }
    });

    const users: User[] = data?.users || [];

    // Fonctions d'analyse d'identité
    const isIdentityVerified = (user: User): boolean => {
        const s = user.identityVerification?.status?.toLowerCase();
        return s === 'verified' || s === 'oui' || (user.role === 'host' && user.isVerified);
    };

    const isPendingVerification = (user: User): boolean => {
        const s = user.identityVerification?.status?.toLowerCase();
        return s === 'pending';
    };

    const isRejectedVerification = (user: User): boolean => {
        const s = user.identityVerification?.status?.toLowerCase();
        return s === 'rejected';
    };

    const hasIdentityDocs = (user: User): boolean => {
        const iv = user.identityVerification;
        return !!(iv && (iv.idDocumentFront || iv.idDocumentBack || iv.idDocumentNumber));
    };

    // Bouton Voir pièces affiché UNIQUEMENT si l'utilisateur est vérifié ET a une pièce non nulle
    const canViewDocs = (user: User): boolean => {
        if (!isIdentityVerified(user)) return false;
        const iv = user.identityVerification;
        if (!iv) return false;
        const hasFront = !!(iv.idDocumentFront && iv.idDocumentFront.trim());
        const hasBack = !!(iv.idDocumentBack && iv.idDocumentBack.trim());
        const hasNum = !!(iv.idDocumentNumber && iv.idDocumentNumber.trim());
        return hasFront || hasBack || hasNum;
    };

    const handleToggleVerify = (user: User, makeVerified: boolean) => {
        const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        if (makeVerified) {
            if (window.confirm(`Confirmer la validation officielle de l'identité de "${name}" ?\nCet utilisateur obtiendra immédiatement le statut d'Hôte vérifié.`)) {
                verifyMutation.mutate({ userId: user._id, isVerified: true });
            }
        } else {
            if (window.confirm(`Voulez-vous retirer le statut vérifié de "${name}" ?`)) {
                verifyMutation.mutate({ userId: user._id, isVerified: false });
            }
        }
    };

    // Calcul des statistiques
    const stats = useMemo(() => {
        const total = users.length;
        const verifiedHosts = users.filter(u => isIdentityVerified(u) || u.role === 'host').length;
        const unverifiedGuests = users.filter(u => u.role === 'guest' && !isIdentityVerified(u)).length;
        const pending = users.filter(u => isPendingVerification(u)).length;
        return { total, verifiedHosts, unverifiedGuests, pending };
    }, [users]);

    // Filtrage dynamique
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (filterType === 'verified_hosts') {
                if (!(isIdentityVerified(user) || user.role === 'host')) return false;
            } else if (filterType === 'unverified_guests') {
                if (!(user.role === 'guest' && !isIdentityVerified(user))) return false;
            } else if (filterType === 'pending') {
                if (!isPendingVerification(user)) return false;
            } else if (filterType === 'all_hosts') {
                if (user.role !== 'host') return false;
            } else if (filterType === 'all_guests') {
                if (user.role !== 'guest') return false;
            }

            if (search.trim()) {
                const q = search.toLowerCase().trim();
                const fullName = (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`).toLowerCase();
                const email = (user.email || '').toLowerCase();
                const phone = (user.phone || '').toLowerCase();
                const docNum = (user.identityVerification?.idDocumentNumber || '').toLowerCase();
                return fullName.includes(q) || email.includes(q) || phone.includes(q) || docNum.includes(q);
            }

            return true;
        });
    }, [users, filterType, search]);

    const handleCopyDocNumber = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedDoc(true);
        setTimeout(() => setCopiedDoc(false), 2000);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <div style={{ color: 'var(--primary)', fontWeight: '600' }}>Chargement des utilisateurs...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header & Titre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' }}>
                        Gestion des Utilisateurs & Pièces d'Identité
                    </h1>
                    <p style={{ color: '#64748B', marginTop: '4px', fontSize: '14px' }}>
                        Contrôle de conformité des pièces d'identité officielles et habilitation des hôtes.
                    </p>
                </div>

                {/* Cartes KPI professionnelles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div
                        onClick={() => setFilterType('all')}
                        style={{
                            padding: '16px 18px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: filterType === 'all' ? '2px solid #0F172A' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Utilisateurs</span>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                                <UsersIcon size={16} />
                            </div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{stats.total}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Ensemble des comptes</div>
                    </div>

                    <div
                        onClick={() => setFilterType('verified_hosts')}
                        style={{
                            padding: '16px 18px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: filterType === 'verified_hosts' ? '2px solid #059669' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>Hôtes Vérifiés (Pièce Validée)</span>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                                <ShieldCheck size={16} />
                            </div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>{stats.verifiedHosts}</div>
                        <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>Identité officielle validée</div>
                    </div>

                    <div
                        onClick={() => setFilterType('unverified_guests')}
                        style={{
                            padding: '16px 18px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: filterType === 'unverified_guests' ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase' }}>Voyageurs Non Vérifiés</span>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                                <UserX size={16} />
                            </div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{stats.unverifiedGuests}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Sans pièce d'identité</div>
                    </div>

                    <div
                        onClick={() => setFilterType('pending')}
                        style={{
                            padding: '16px 18px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: filterType === 'pending' ? '2px solid #D97706' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#D97706', textTransform: 'uppercase' }}>En Attente d'Examen</span>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                                <Clock size={16} />
                            </div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#D97706' }}>{stats.pending}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Dossiers à contrôler</div>
                    </div>
                </div>

                {/* Recherche & Filtres rapides */}
                <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email, téléphone ou numéro de pièce..."
                            className="input-field"
                            style={{ paddingLeft: '42px', marginBottom: 0, height: '42px', borderRadius: '8px', fontSize: '14px', border: '1px solid #CBD5E1' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filtres de sélection */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', marginRight: '4px' }}>Filtres :</span>

                        <button
                            type="button"
                            onClick={() => setFilterType('all')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: filterType === 'all' ? '700' : '500',
                                backgroundColor: filterType === 'all' ? '#0F172A' : '#F1F5F9',
                                color: filterType === 'all' ? 'white' : '#334155',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Tous ({stats.total})
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilterType('verified_hosts')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: filterType === 'verified_hosts' ? '700' : '500',
                                backgroundColor: filterType === 'verified_hosts' ? '#059669' : '#ECFDF5',
                                color: filterType === 'verified_hosts' ? 'white' : '#047857',
                                border: '1px solid #A7F3D0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <ShieldCheck size={15} />
                            Hôtes vérifiés ({stats.verifiedHosts})
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilterType('unverified_guests')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: filterType === 'unverified_guests' ? '700' : '500',
                                backgroundColor: filterType === 'unverified_guests' ? '#2563EB' : '#EFF6FF',
                                color: filterType === 'unverified_guests' ? 'white' : '#1D4ED8',
                                border: '1px solid #BFDBFE',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <UserX size={15} />
                            Voyageurs non vérifiés ({stats.unverifiedGuests})
                        </button>

                        {stats.pending > 0 && (
                            <button
                                type="button"
                                onClick={() => setFilterType('pending')}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: filterType === 'pending' ? '700' : '500',
                                    backgroundColor: filterType === 'pending' ? '#D97706' : '#FEF3C7',
                                    color: filterType === 'pending' ? 'white' : '#B45309',
                                    border: '1px solid #FDE68A',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Clock size={15} />
                                En attente ({stats.pending})
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setFilterType('all_hosts')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: filterType === 'all_hosts' ? '700' : '500',
                                backgroundColor: filterType === 'all_hosts' ? '#475569' : '#F8FAFC',
                                color: filterType === 'all_hosts' ? 'white' : '#475569',
                                border: '1px solid #E2E8F0',
                                cursor: 'pointer'
                            }}
                        >
                            Tous les Hôtes
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilterType('all_guests')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: filterType === 'all_guests' ? '700' : '500',
                                backgroundColor: filterType === 'all_guests' ? '#475569' : '#F8FAFC',
                                color: filterType === 'all_guests' ? 'white' : '#475569',
                                border: '1px solid #E2E8F0',
                                cursor: 'pointer'
                            }}
                        >
                            Tous les Voyageurs
                        </button>
                    </div>
                </div>
            </div>

            {/* Vue des Utilisateurs : Tableau & Cartes Mobile */}
            <ResponsiveDataView
                data={filteredUsers}
                renderCard={(user: User) => {
                    const verified = isIdentityVerified(user);
                    const pending = isPendingVerification(user);
                    const isHostUser = user.role === 'host';

                    return (
                        <div
                            className="user-mobile-card"
                            style={{
                                border: verified ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                                borderRadius: '12px',
                                backgroundColor: 'white',
                                padding: '16px',
                                marginBottom: '14px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                        >
                            {/* Header carte */}
                            <div className="mobile-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || '')}+${encodeURIComponent(user.lastName || '')}&background=random`}
                                    alt=""
                                    style={{ borderRadius: '50%', width: '46px', height: '46px', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                                            {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`}
                                        </h3>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: isHostUser ? '#F5F3FF' : '#EFF6FF',
                                            color: isHostUser ? '#6D28D9' : '#1D4ED8',
                                            border: `1px solid ${isHostUser ? '#DDD6FE' : '#BFDBFE'}`
                                        }}>
                                            {isHostUser ? 'HÔTE' : 'VOYAGEUR'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{user.email}</p>
                                </div>
                            </div>

                            {/* Corps carte */}
                            <div className="mobile-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', padding: '12px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>TÉLÉPHONE</span>
                                    <span style={{ fontWeight: '500', color: '#0F172A' }}>{user.phone || 'Non renseigné'}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>VÉRIFICATION PIÈCE</span>
                                    <span>
                                        {verified ? (
                                            <span style={{ color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <ShieldCheck size={15} /> Pièce Validée
                                            </span>
                                        ) : pending ? (
                                            <span style={{ color: '#D97706', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={15} /> En attente
                                            </span>
                                        ) : (
                                            <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <ShieldOff size={15} /> Non vérifié
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {user.identityVerification?.idDocumentType && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748B', fontWeight: '600' }}>TYPE DOCUMENT</span>
                                        <span style={{ fontWeight: '600', color: '#1E293B' }}>
                                            {formatDocumentType(user.identityVerification.idDocumentType)}
                                            {user.identityVerification.idDocumentNumber && ` (${user.identityVerification.idDocumentNumber})`}
                                        </span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>STATUT COMPTE</span>
                                    <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-cancelled'}`}>
                                        {user.status === 'active' ? 'Actif' : 'Suspendu'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748B', fontWeight: '600' }}>INSCRIPTION</span>
                                    <span style={{ color: '#64748B' }}>
                                        {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Actions carte mobile */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                {/* 1. Bouton mobile : UNIQUEMENT pour les utilisateurs vérifiés ET ayant une pièce non nulle */}
                                {canViewDocs(user) && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedUserForDocs(user);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            backgroundColor: '#ECFDF5',
                                            color: '#059669',
                                            border: '1px solid #A7F3D0',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <IdCard size={17} color="#059669" />
                                        <span>Consulter la pièce d'identité</span>
                                    </button>
                                )}

                                {/* 2. Bouton Rendre vérifié ou Retirer vérification */}
                                {verified ? (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleVerify(user, false)}
                                        disabled={verifyMutation.isPending}
                                        style={{
                                            width: '100%',
                                            padding: '9px 14px',
                                            backgroundColor: '#FEF3C7',
                                            color: '#B45309',
                                            border: '1px solid #FDE68A',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <UserX size={16} />
                                        <span>Retirer la vérification d'identité</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleVerify(user, true)}
                                        disabled={verifyMutation.isPending}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            backgroundColor: '#059669',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            fontWeight: '700',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <UserCheck size={17} />
                                        <span>Rendre cet utilisateur vérifié</span>
                                    </button>
                                )}

                                {/* 3. Bouton Suspendre / Activer */}
                                <button
                                    type="button"
                                    onClick={() => mutation.mutate({
                                        userId: user._id,
                                        status: user.status === 'active' ? 'suspended' : 'active'
                                    })}
                                    style={{
                                        width: '100%',
                                        padding: '9px 14px',
                                        backgroundColor: user.status === 'active' ? '#FEF2F2' : '#F0FDF4',
                                        color: user.status === 'active' ? '#DC2626' : '#16A34A',
                                        border: `1px solid ${user.status === 'active' ? '#FECACA' : '#BBF7D0'}`,
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {user.status === 'active' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                    <span>{user.status === 'active' ? 'Suspendre le compte' : 'Activer le compte'}</span>
                                </button>
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
                                        <th>Utilisateur & Rôle</th>
                                        <th>Téléphone</th>
                                        <th>Vérification d'Identité</th>
                                        <th>Document Officiel</th>
                                        <th>Statut</th>
                                        <th>Inscription</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                                                <UsersIcon size={32} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
                                                <p style={{ fontWeight: '600', fontSize: '15px' }}>Aucun utilisateur ne correspond à ce filtre</p>
                                                <p style={{ fontSize: '13px', marginTop: '4px' }}>Modifiez votre sélection ou le mot-clé de recherche.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => {
                                            const verified = isIdentityVerified(user);
                                            const pending = isPendingVerification(user);
                                            const rejected = isRejectedVerification(user);
                                            const isHostUser = user.role === 'host';

                                            return (
                                                <tr key={user._id} style={{ backgroundColor: verified ? '#FAFCFA' : undefined }}>
                                                    {/* Utilisateur & Rôle */}
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <img
                                                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || '')}+${encodeURIComponent(user.lastName || '')}&background=random`}
                                                                alt=""
                                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                                                            />
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <p style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>
                                                                        {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`}
                                                                    </p>
                                                                    <span style={{
                                                                        fontSize: '11px',
                                                                        fontWeight: '700',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '6px',
                                                                        backgroundColor: isHostUser ? '#F5F3FF' : '#EFF6FF',
                                                                        color: isHostUser ? '#6D28D9' : '#1D4ED8',
                                                                        border: `1px solid ${isHostUser ? '#DDD6FE' : '#BFDBFE'}`
                                                                    }}>
                                                                        {isHostUser ? 'HÔTE' : 'VOYAGEUR'}
                                                                    </span>
                                                                </div>
                                                                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Téléphone */}
                                                    <td>
                                                        <p style={{ fontSize: '13px', fontWeight: '500' }}>{user.phone || <span style={{ color: '#94A3B8' }}>Non renseigné</span>}</p>
                                                    </td>

                                                    {/* Statut d'identité */}
                                                    <td>
                                                        {verified ? (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                backgroundColor: '#ECFDF5',
                                                                color: '#059669',
                                                                border: '1px solid #A7F3D0'
                                                            }}>
                                                                <ShieldCheck size={14} /> Pièce Validée
                                                            </span>
                                                        ) : pending ? (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                backgroundColor: '#FEF3C7',
                                                                color: '#D97706',
                                                                border: '1px solid #FDE68A'
                                                            }}>
                                                                <Clock size={14} /> En attente
                                                            </span>
                                                        ) : rejected ? (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                backgroundColor: '#FEF2F2',
                                                                color: '#DC2626',
                                                                border: '1px solid #FECACA'
                                                            }}>
                                                                <ShieldAlert size={14} /> Rejeté
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '12px',
                                                                fontWeight: '500',
                                                                backgroundColor: '#F1F5F9',
                                                                color: '#64748B',
                                                                border: '1px solid #E2E8F0'
                                                            }}>
                                                                <ShieldOff size={14} /> Non vérifié
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Détails Document */}
                                                    <td>
                                                        {user.identityVerification?.idDocumentType ? (
                                                            <div>
                                                                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                                                                    {formatDocumentType(user.identityVerification.idDocumentType)}
                                                                </p>
                                                                {user.identityVerification.idDocumentNumber && (
                                                                    <p style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
                                                                        N° {user.identityVerification.idDocumentNumber}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Aucun document</span>
                                                        )}
                                                    </td>

                                                    {/* Statut Compte */}
                                                    <td>
                                                        <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-cancelled'}`}>
                                                            {user.status === 'active' ? 'Actif' : 'Suspendu'}
                                                        </span>
                                                    </td>

                                                    {/* Inscription */}
                                                    <td style={{ fontSize: '13px', color: '#64748B' }}>
                                                        {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        })}
                                                    </td>

                                                    {/* Actions */}
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            {/* 1. Bouton Voir pièces : UNIQUEMENT pour les utilisateurs vérifiés ET ayant une pièce non nulle */}
                                                            {canViewDocs(user) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setSelectedUserForDocs(user);
                                                                    }}
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#ECFDF5',
                                                                        color: '#059669',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #A7F3D0',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title="Consulter la pièce d'identité officielle"
                                                                >
                                                                    <IdCard size={15} color="#059669" />
                                                                    <span>Voir pièces</span>
                                                                </button>
                                                            )}

                                                            {/* 2. Bouton Rendre vérifié ou Retirer vérification */}
                                                            {verified ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleVerify(user, false)}
                                                                    disabled={verifyMutation.isPending}
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '6px 10px',
                                                                        backgroundColor: '#FEF3C7',
                                                                        color: '#B45309',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #FDE68A',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title="Retirer la vérification d'identité"
                                                                >
                                                                    <UserX size={15} />
                                                                    <span>Retirer vérif</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleVerify(user, true)}
                                                                    disabled={verifyMutation.isPending}
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#059669',
                                                                        color: 'white',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '700',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                                    }}
                                                                    title="Valider manuellement l'identité de cet utilisateur et le certifier hôte"
                                                                >
                                                                    <UserCheck size={15} />
                                                                    <span>Rendre vérifié</span>
                                                                </button>
                                                            )}

                                                            {/* 3. Bouton Suspendre / Activer */}
                                                            <button
                                                                type="button"
                                                                onClick={() => mutation.mutate({
                                                                    userId: user._id,
                                                                    status: user.status === 'active' ? 'suspended' : 'active'
                                                                })}
                                                                className="btn"
                                                                style={{
                                                                    padding: '7px',
                                                                    backgroundColor: user.status === 'active' ? '#FEF2F2' : '#F0FDF4',
                                                                    color: user.status === 'active' ? '#DC2626' : '#16A34A',
                                                                    borderRadius: '8px',
                                                                    border: `1px solid ${user.status === 'active' ? '#FECACA' : '#BBF7D0'}`
                                                                }}
                                                                title={user.status === 'active' ? 'Suspendre le compte' : 'Activer le compte'}
                                                            >
                                                                {user.status === 'active' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                                            </button>
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

            {/* MODALE D'EXAMEN DES PIÈCES D'IDENTITÉ - RENDUE VIA PORTAL POUR COMPATIBILITÉ TOTALE MOBILE & DESKTOP */}
            {selectedUserForDocs && createPortal(
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
                        padding: '16px',
                        overflowY: 'auto'
                    }}
                    onClick={() => setSelectedUserForDocs(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            maxWidth: '780px',
                            width: '100%',
                            maxHeight: '92vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                            border: '1px solid #CBD5E1'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modale Professionnel */}
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
                                    backgroundColor: isIdentityVerified(selectedUserForDocs) ? '#ECFDF5' : '#EFF6FF',
                                    color: isIdentityVerified(selectedUserForDocs) ? '#059669' : '#2563EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <IdCard size={22} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                                            Pièce d'identité - {selectedUserForDocs.fullName || `${selectedUserForDocs.firstName || ''} ${selectedUserForDocs.lastName || ''}`}
                                        </h2>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: selectedUserForDocs.role === 'host' ? '#F5F3FF' : '#EFF6FF',
                                            color: selectedUserForDocs.role === 'host' ? '#6D28D9' : '#1D4ED8',
                                            border: `1px solid ${selectedUserForDocs.role === 'host' ? '#DDD6FE' : '#BFDBFE'}`
                                        }}>
                                            {selectedUserForDocs.role === 'host' ? 'HÔTE' : 'VOYAGEUR'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', margin: 0 }}>
                                        {selectedUserForDocs.email} • Téléphone : {selectedUserForDocs.phone || 'Non renseigné'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedUserForDocs(null)}
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
                                backgroundColor: isIdentityVerified(selectedUserForDocs) ? '#F0FDF4' : '#FFFBEB',
                                border: isIdentityVerified(selectedUserForDocs) ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '14px'
                            }}>
                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Statut de Conformité</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                        {isIdentityVerified(selectedUserForDocs) ? (
                                            <>
                                                <CheckCircle2 size={16} color="#059669" />
                                                <strong style={{ color: '#059669', fontSize: '14px' }}>Validé & Conforme</strong>
                                            </>
                                        ) : isPendingVerification(selectedUserForDocs) ? (
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
                                        {formatDocumentType(selectedUserForDocs.identityVerification?.idDocumentType)}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Numéro de Document</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>
                                            {selectedUserForDocs.identityVerification?.idDocumentNumber || 'Non renseigné'}
                                        </span>
                                        {selectedUserForDocs.identityVerification?.idDocumentNumber && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopyDocNumber(selectedUserForDocs.identityVerification!.idDocumentNumber!)}
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

                                {selectedUserForDocs.identityVerification?.verifiedAt && (
                                    <div>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Date de Validation</span>
                                        <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px', fontWeight: '500' }}>
                                            {new Date(selectedUserForDocs.identityVerification.verifiedAt).toLocaleDateString('fr-FR', {
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
                                    Aperçu des pièces d'identité officielles
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
                                            {selectedUserForDocs.identityVerification?.idDocumentFront && (
                                                <button
                                                    type="button"
                                                    onClick={() => setZoomImage({
                                                        url: getMediaUrl(selectedUserForDocs.identityVerification?.idDocumentFront),
                                                        title: `Recto de la pièce - ${selectedUserForDocs.fullName}`
                                                    })}
                                                    style={{ background: 'transparent', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                                >
                                                    <Eye size={14} /> Agrandir
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            {selectedUserForDocs.identityVerification?.idDocumentFront ? (
                                                <img
                                                    src={getMediaUrl(selectedUserForDocs.identityVerification.idDocumentFront)}
                                                    alt="Recto de la pièce"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', backgroundColor: '#F1F5F9' }}
                                                    onClick={() => setZoomImage({
                                                        url: getMediaUrl(selectedUserForDocs.identityVerification?.idDocumentFront),
                                                        title: `Recto de la pièce - ${selectedUserForDocs.fullName}`
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
                                                Verso {selectedUserForDocs.identityVerification?.idDocumentType === 'passport' ? '(Non requis pour Passeport)' : 'de la pièce'}
                                            </span>
                                            {selectedUserForDocs.identityVerification?.idDocumentBack && (
                                                <button
                                                    type="button"
                                                    onClick={() => setZoomImage({
                                                        url: getMediaUrl(selectedUserForDocs.identityVerification?.idDocumentBack),
                                                        title: `Verso de la pièce - ${selectedUserForDocs.fullName}`
                                                    })}
                                                    style={{ background: 'transparent', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                                >
                                                    <Eye size={14} /> Agrandir
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            {selectedUserForDocs.identityVerification?.idDocumentBack ? (
                                                <img
                                                    src={getMediaUrl(selectedUserForDocs.identityVerification.idDocumentBack)}
                                                    alt="Verso de la pièce"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer', backgroundColor: '#F1F5F9' }}
                                                    onClick={() => setZoomImage({
                                                        url: getMediaUrl(selectedUserForDocs.identityVerification?.idDocumentBack),
                                                        title: `Verso de la pièce - ${selectedUserForDocs.fullName}`
                                                    })}
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>
                                                    <IdCard size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                                    <p style={{ fontSize: '13px', fontWeight: '500' }}>
                                                        {selectedUserForDocs.identityVerification?.idDocumentType === 'passport'
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
                                onClick={() => setSelectedUserForDocs(null)}
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
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '92%',
                            maxHeight: '90%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            color: 'white',
                            marginBottom: '12px'
                        }}>
                            <span style={{ fontSize: '15px', fontWeight: '700' }}>{zoomImage.title}</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <a
                                    href={zoomImage.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        color: 'white',
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <ExternalLink size={14} /> Ouvrir original
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setZoomImage(null)}
                                    style={{
                                        backgroundColor: '#EF4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <img
                            src={zoomImage.url}
                            alt=""
                            style={{
                                maxWidth: '100%',
                                maxHeight: '78vh',
                                borderRadius: '8px',
                                objectFit: 'contain',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                backgroundColor: '#111'
                            }}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default UsersPage;
