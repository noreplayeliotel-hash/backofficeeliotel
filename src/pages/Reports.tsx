import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllReports, updateReportStatus, deleteReport, updateUserStatus } from '../services/adminService';
import {
    ShieldAlert,
    Trash2,
    Search,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    IdCard,
    UserX,
    UserCheck,
    Eye,
    X,
    Copy,
    Check,
    CheckCircle2,
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

const ReportsPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [selectedHostForDocs, setSelectedHostForDocs] = useState<any | null>(null);
    const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
    const [copiedDoc, setCopiedDoc] = useState(false);

    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['adminReports', search],
        queryFn: () => getAllReports({ search })
    });

    const statusMutation = useMutation({
        mutationFn: ({ reportId, status }: { reportId: string, status: string }) => updateReportStatus(reportId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReports'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (reportId: string) => deleteReport(reportId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminReports'] });
        }
    });

    const blockMutation = useMutation({
        mutationFn: ({ userId, status }: { userId: string; status: string }) =>
            updateUserStatus(userId, status),
        onSuccess: (_data, { userId, status }) => {
            queryClient.setQueriesData({ queryKey: ['adminReports'] }, (oldData: any) => {
                if (!oldData || !oldData.reports) return oldData;
                return {
                    ...oldData,
                    reports: oldData.reports.map((report: any) => {
                        const newReport = { ...report };
                        if (newReport.reporter && newReport.reporter._id === userId) {
                            newReport.reporter = { ...newReport.reporter, status };
                        }
                        if (newReport.reportedUser && newReport.reportedUser._id === userId) {
                            newReport.reportedUser = { ...newReport.reportedUser, status };
                        }
                        if (newReport.reportedListing?.host && newReport.reportedListing.host._id === userId) {
                            newReport.reportedListing = {
                                ...newReport.reportedListing,
                                host: { ...newReport.reportedListing.host, status }
                            };
                        }
                        return newReport;
                    })
                };
            });
            queryClient.invalidateQueries({ queryKey: ['adminReports'] });
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (err: any) => {
            alert(`Erreur lors de la mise à jour du statut : ${err.response?.data?.message || err.message}`);
        }
    });

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

    // Obtenir l'hôte ciblé par le signalement
    const getHostUser = (report: any) => {
        if (report.reportedListing?.host && typeof report.reportedListing.host === 'object') {
            return report.reportedListing.host;
        }
        if (report.reportedUser && typeof report.reportedUser === 'object') {
            return report.reportedUser;
        }
        return null;
    };

    // Obtenir le rapporteur
    const getReporterUser = (report: any) => {
        if (report.reporter && typeof report.reporter === 'object') {
            return report.reporter;
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

    if (isLoading) return <div style={{ padding: '24px' }}>Chargement...</div>;

    const reports = data?.reports || [];

    const handleStatusUpdate = (reportId: string, status: string) => {
        statusMutation.mutate({ reportId, status });
    };

    const confirmDelete = (reportId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
            deleteMutation.mutate(reportId);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '9999px', width: 'fit-content' }}><Clock size={14} /> En attente</span>;
            case 'reviewed':
                return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', backgroundColor: '#DBEAFE', color: '#1E40AF', borderRadius: '9999px', width: 'fit-content' }}><ShieldAlert size={14} /> Examiné</span>;
            case 'resolved':
                return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '9999px', width: 'fit-content' }}><CheckCircle size={14} /> Résolu</span>;
            case 'dismissed':
                return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '9999px', width: 'fit-content' }}><XCircle size={14} /> Rejeté</span>;
            default:
                return null;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Gestion des Signalements</h1>
                    <p style={{ color: 'var(--light)', marginTop: '4px' }}>
                        Modérez les signalements, vérifiez l'identité de l'hôte et bloquez les utilisateurs abusifs ou les rapporteurs non conformes.
                    </p>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--light)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher par motif, détails, hôte ou rapporteur..."
                            className="input-field"
                            style={{ paddingLeft: '40px', marginBottom: 0 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <ResponsiveDataView
                data={reports}
                renderCard={(report: any) => {
                    const hostUser = getHostUser(report);
                    const reporterUser = getReporterUser(report);

                    return (
                        <div className="user-mobile-card">
                            {/* Header avec icône et raison */}
                            <div className="mobile-card-header">
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    backgroundColor: '#FEF3C7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <ShieldAlert size={22} color="#92400E" />
                                </div>
                                <div className="mobile-card-title-section">
                                    <h3 className="mobile-card-title">{report.reason}</h3>
                                    <p className="mobile-card-subtitle">{report.details}</p>
                                </div>
                            </div>

                            {/* Body avec les détails */}
                            <div className="mobile-card-body" style={{ gap: '14px' }}>
                                {/* Élément signalé & Actions Hôte */}
                                <div className="mobile-card-row" style={{ alignItems: 'flex-start' }}>
                                    <span className="mobile-card-label">ÉLÉMENT SIGNALÉ</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                        {report.reportedUser ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <AlertCircle size={16} color="var(--error)" />
                                                <div style={{ textAlign: 'right' }}>
                                                    <span className="mobile-card-value">{report.reportedUser.firstName} {report.reportedUser.lastName}</span>
                                                    {report.reportedUser.phone && <span style={{ fontSize: '11px', color: 'var(--light)', marginLeft: '4px' }}>({report.reportedUser.phone})</span>}
                                                    {report.reportedUser.status === 'suspended' && (
                                                        <span style={{ display: 'inline-block', marginLeft: '6px', fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                            SUSPENDU
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : report.reportedListing ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img
                                                    src={report.reportedListing.images?.[0]?.url || 'https://via.placeholder.com/40x30'}
                                                    alt=""
                                                    style={{ width: '40px', height: '30px', borderRadius: '4px', objectFit: 'cover' }}
                                                />
                                                <div style={{ textAlign: 'right' }}>
                                                    <span className="mobile-card-value">{report.reportedListing.title}</span>
                                                    <p style={{ fontSize: '11px', color: 'var(--light)', margin: 0 }}>
                                                        Hôte: {report.reportedListing.host?.firstName} {report.reportedListing.host?.lastName}
                                                        {report.reportedListing.host?.status === 'suspended' && (
                                                            <span style={{ marginLeft: '4px', fontSize: '9px', fontWeight: '700', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                                SUSPENDU
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="mobile-card-value">Inconnu</span>
                                        )}

                                        {/* Boutons Pièce d'identité et Bloquer pour l'hôte */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '4px' }}>
                                            {hostUser && canViewDocs(hostUser) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedHostForDocs(hostUser)}
                                                    style={{
                                                        backgroundColor: '#EFF6FF',
                                                        color: '#1D4ED8',
                                                        border: '1px solid #BFDBFE',
                                                        borderRadius: '6px',
                                                        padding: '4px 8px',
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
                                                        padding: '4px 8px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {hostUser.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                    <span>{hostUser.status === 'suspended' ? 'Débloquer hôte' : 'Bloquer hôte'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Rapporteur & Actions Rapporteur */}
                                <div className="mobile-card-row" style={{ alignItems: 'flex-start' }}>
                                    <span className="mobile-card-label">RAPPORTEUR</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="mobile-card-value">{report.reporter?.firstName} {report.reporter?.lastName}</span>
                                            {reporterUser?.status === 'suspended' && (
                                                <span style={{ display: 'inline-block', marginLeft: '6px', fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                    SUSPENDU
                                                </span>
                                            )}
                                            <div style={{ fontSize: '11px', color: 'var(--light)' }}>{report.reporter?.email}</div>
                                            {report.reporter?.phone && <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '500' }}>{report.reporter.phone}</div>}
                                        </div>

                                        {reporterUser && (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleBlock(reporterUser, 'le rapporteur')}
                                                style={{
                                                    backgroundColor: reporterUser.status === 'suspended' ? '#DCFCE7' : '#FEE2E2',
                                                    color: reporterUser.status === 'suspended' ? '#15803D' : '#DC2626',
                                                    border: `1px solid ${reporterUser.status === 'suspended' ? '#86EFAC' : '#FCA5A5'}`,
                                                    borderRadius: '6px',
                                                    padding: '4px 8px',
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
                                    </div>
                                </div>

                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">STATUT</span>
                                    {getStatusBadge(report.status)}
                                </div>

                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">DATE</span>
                                    <span className="mobile-card-value">
                                        {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="mobile-card-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                    <span className="mobile-card-label">CHANGER LE STATUT</span>
                                    <select
                                        value={report.status}
                                        onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontSize: '14px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="reviewed">Examiné</option>
                                        <option value="resolved">Résolu</option>
                                        <option value="dismissed">Rejeté</option>
                                    </select>
                                </div>
                            </div>

                            {/* Footer avec actions */}
                            <div className="mobile-card-footer">
                                <button
                                    onClick={() => confirmDelete(report._id)}
                                    className="mobile-card-action-btn"
                                    style={{
                                        backgroundColor: '#FDF2F2',
                                        color: 'var(--error)',
                                        borderColor: '#FEE2E2'
                                    }}
                                >
                                    <Trash2 size={18} />
                                    <span>Supprimer le signalement</span>
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
                                        <th style={{ width: '22%' }}>Signalement</th>
                                        <th style={{ width: '28%' }}>Élément Signalé & Hôte</th>
                                        <th style={{ width: '24%' }}>Rapporteur</th>
                                        <th style={{ width: '12%' }}>Statut</th>
                                        <th style={{ width: '8%' }}>Date</th>
                                        <th style={{ width: '6%', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--light)' }}>
                                                Aucun signalement trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        reports.map((report: any) => {
                                            const hostUser = getHostUser(report);
                                            const reporterUser = getReporterUser(report);

                                            return (
                                                <tr key={report._id} style={{ verticalAlign: 'top' }}>
                                                    {/* Colonne 1 : Motif et détails */}
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '280px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <ShieldAlert size={16} color="#B45309" />
                                                                <span style={{ fontWeight: '600', color: 'var(--dark)', fontSize: '13.5px' }}>{report.reason}</span>
                                                            </div>
                                                            <p style={{ fontSize: '12.5px', color: '#4B5563', margin: 0, lineHeight: '1.4' }}>{report.details}</p>
                                                        </div>
                                                    </td>

                                                    {/* Colonne 2 : Élément signalé & Actions Hôte */}
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {report.reportedUser ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                        <AlertCircle size={17} color="var(--error)" />
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--dark)' }}>
                                                                                {report.reportedUser.firstName} {report.reportedUser.lastName}
                                                                            </span>
                                                                            {report.reportedUser.status === 'suspended' && (
                                                                                <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                                                    SUSPENDU
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p style={{ fontSize: '11.5px', color: 'var(--light)', margin: 0 }}>
                                                                            Utilisateur {report.reportedUser.phone && `(${report.reportedUser.phone})`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : report.reportedListing ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{ width: '44px', height: '34px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                                                                        <img src={report.reportedListing.images?.[0]?.url || 'https://via.placeholder.com/40x30'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    </div>
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--dark)' }}>
                                                                            {report.reportedListing.title}
                                                                        </p>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                                            <span style={{ fontSize: '11px', color: 'var(--light)' }}>
                                                                                Hôte: {report.reportedListing.host?.firstName} {report.reportedListing.host?.lastName}
                                                                            </span>
                                                                            {report.reportedListing.host?.status === 'suspended' && (
                                                                                <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                                                    SUSPENDU
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span style={{ color: 'var(--light)', fontSize: '13px' }}>Inconnu</span>
                                                            )}

                                                            {/* Boutons Voir pièce d'identité et Bloquer pour l'hôte */}
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
                                                                        title={hostUser.status === 'suspended' ? 'Débloquer cet hôte' : 'Bloquer cet hôte'}
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
                                                    </td>

                                                    {/* Colonne 3 : Rapporteur & Actions */}
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dark)' }}>
                                                                    {report.reporter?.firstName} {report.reporter?.lastName}
                                                                </span>
                                                                {reporterUser?.status === 'suspended' && (
                                                                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                                                        SUSPENDU
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span style={{ fontSize: '11px', color: 'var(--light)' }}>{report.reporter?.email}</span>
                                                            {report.reporter?.phone && (
                                                                <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: '500' }}>
                                                                    {report.reporter.phone}
                                                                </span>
                                                            )}

                                                            {reporterUser && (
                                                                <div style={{ marginTop: '2px' }}>
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
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Colonne 4 : Statut */}
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            {getStatusBadge(report.status)}
                                                            <select
                                                                value={report.status}
                                                                onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                                                                style={{
                                                                    padding: '4px 6px',
                                                                    fontSize: '11.5px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid var(--border)',
                                                                    backgroundColor: 'white',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <option value="pending">En attente</option>
                                                                <option value="reviewed">Examiné</option>
                                                                <option value="resolved">Résolu</option>
                                                                <option value="dismissed">Rejeté</option>
                                                            </select>
                                                        </div>
                                                    </td>

                                                    {/* Colonne 5 : Date */}
                                                    <td>
                                                        <span style={{ fontSize: '12px', color: 'var(--light)', whiteSpace: 'nowrap' }}>
                                                            {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </td>

                                                    {/* Colonne 6 : Actions */}
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => confirmDelete(report._id)}
                                                            className="btn"
                                                            style={{
                                                                padding: '6px 8px',
                                                                backgroundColor: '#FDF2F2',
                                                                color: 'var(--error)',
                                                                borderRadius: '6px',
                                                                border: '1px solid #FEE2E2',
                                                                cursor: 'pointer'
                                                            }}
                                                            title="Supprimer le signalement"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
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

            {/* MODALE VISUALISATION PIÈCE D'IDENTITÉ HÔTE - VIA PORTAL */}
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

export default ReportsPage;
