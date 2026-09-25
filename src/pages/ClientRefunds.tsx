import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    RotateCcw,
    Search,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle,
    ShieldAlert,
    Copy,
    Check,
    RefreshCw
} from 'lucide-react';
import { getClientRefunds, processClientRefund, updateBooking } from '../services/adminService';
import type { Booking } from '../types';
import CancellationRefundModal from '../components/bookings/CancellationRefundModal';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

const ClientRefundsPage: React.FC = () => {
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [policyFilter, setPolicyFilter] = useState<string>('all');
    const [initiatorFilter, setInitiatorFilter] = useState<string>('all');

    // Modals & state
    const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);
    const [copiedRib, setCopiedRib] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    // Fetch data
    const { data: refundsData, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['adminClientRefunds', statusFilter, policyFilter, initiatorFilter, search],
        queryFn: () => getClientRefunds({
            status: statusFilter,
            policy: policyFilter,
            initiator: initiatorFilter,
            search
        })
    });

    // Mutation to mark refund as completed
    const processRefundMutation = useMutation({
        mutationFn: ({ bookingId, refundStatus }: { bookingId: string; refundStatus: string }) =>
            processClientRefund(bookingId, { refundStatus }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminClientRefunds'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
            showToast('Virement validé avec succès. Le client a été notifié de l\'émission des fonds.');
        },
        onError: (err: any) => {
            showToast(err.response?.data?.message || err.message, 'error');
        }
    });

    // Mutation from modal to adjust details
    const adjustMutation = useMutation({
        mutationFn: ({ bookingId, data }: { bookingId: string; data: any }) =>
            updateBooking(bookingId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminClientRefunds'] });
            queryClient.invalidateQueries({ queryKey: ['adminStats'] });
            queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
            showToast('Détails du remboursement et pénalités enregistrés');
            setSelectedBookingForModal(null);
        },
        onError: (err: any) => {
            showToast(err.response?.data?.message || err.message, 'error');
        }
    });

    const handleCopyRib = (rib: string) => {
        navigator.clipboard.writeText(rib);
        setCopiedRib(rib);
        showToast('RIB copié dans le presse-papier', 'info');
        setTimeout(() => setCopiedRib(null), 3000);
    };

    const overview = refundsData?.overview || {
        totalRefunds: 0,
        pendingRefunds: 0,
        completedRefunds: 0,
        pendingCount: 0,
        completedCount: 0,
        totalCancelled: 0
    };

    const refundsList = refundsData?.refunds || [];

    const translatePolicy = (policy: string) => {
        const p = policy?.toLowerCase();
        if (p === 'flexible') return 'Flexible';
        if (p === 'moderate' || p === 'moderee') return 'Modérée';
        if (p === 'strict' || p === 'stricte') return 'Stricte';
        return policy || 'Flexible';
    };

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            {/* Toast Notifications */}
            <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            color: '#FFFFFF',
                            backgroundColor: toast.type === 'success' ? '#111827' : toast.type === 'error' ? '#DC2626' : '#2563EB',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                            fontSize: '13.5px',
                            fontWeight: 500,
                            animation: 'slideIn 0.25s ease'
                        }}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={16} color="#10B981" /> : <AlertCircle size={16} />}
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Header - Airbnb Host/Admin Aesthetic */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF0F2', color: '#E00B41', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                        <RotateCcw size={13} />
                        <span>Finances & Virements</span>
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#222222', letterSpacing: '-0.6px', margin: 0 }}>
                        Remboursements Clients
                    </h1>
                    <p style={{ fontSize: '14.5px', color: '#717171', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        Suivi des virements bancaires à retourner aux voyageurs selon les conditions d'annulation appliquées.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Actualiser les données"
                    >
                        <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
                        <span className="hide-mobile">Actualiser</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards - Airbnb Performance Grid */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '28px' }}>
                {/* Total Remboursements */}
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-header">
                        <div className="dashboard-stat-icon" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                            <CreditCard size={20} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#717171' }}>
                            Calculé auto
                        </span>
                    </div>
                    <div className="dashboard-stat-content">
                        <h3 className="dashboard-stat-label">Total Remboursements</h3>
                        <p className="dashboard-stat-value" style={{ color: '#222222' }}>
                            {overview.totalRefunds.toLocaleString()} €
                        </p>
                    </div>
                </div>

                {/* En attente */}
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-header">
                        <div className="dashboard-stat-icon" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                            <Clock size={20} />
                        </div>
                        <div className="dashboard-stat-change negative">
                            {overview.pendingCount} en attente
                        </div>
                    </div>
                    <div className="dashboard-stat-content">
                        <h3 className="dashboard-stat-label">À Transférer (En attente)</h3>
                        <p className="dashboard-stat-value" style={{ color: '#D97706' }}>
                            {overview.pendingRefunds.toLocaleString()} €
                        </p>
                    </div>
                </div>

                {/* Effectués */}
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-header">
                        <div className="dashboard-stat-icon" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                            <CheckCircle2 size={20} />
                        </div>
                        <div className="dashboard-stat-change positive">
                            {overview.completedCount} réglés
                        </div>
                    </div>
                    <div className="dashboard-stat-content">
                        <h3 className="dashboard-stat-label">Virements Effectués</h3>
                        <p className="dashboard-stat-value" style={{ color: '#16A34A' }}>
                            {overview.completedRefunds.toLocaleString()} €
                        </p>
                    </div>
                </div>

                {/* Réservations annulées */}
                <div className="dashboard-stat-card">
                    <div className="dashboard-stat-header">
                        <div className="dashboard-stat-icon" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                            <ShieldAlert size={20} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#717171' }}>
                            Dossiers
                        </span>
                    </div>
                    <div className="dashboard-stat-content">
                        <h3 className="dashboard-stat-label">Réservations Annulées</h3>
                        <p className="dashboard-stat-value" style={{ color: '#222222' }}>
                            {overview.totalCancelled}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar - Airbnb Capsule Style */}
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EBEBEB',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px'
                }}
            >
                {/* Search capsule */}
                <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#717171' }} />
                    <input
                        type="text"
                        placeholder="Rechercher par voyageur, email, annonce, RIB..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 16px 0 42px',
                            borderRadius: '9999px',
                            border: '1px solid #DDDDDD',
                            fontSize: '13.5px',
                            color: '#222222',
                            backgroundColor: '#FFFFFF',
                            outline: 'none',
                            transition: 'border-color 0.15s'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#222222')}
                        onBlur={(e) => (e.target.style.borderColor = '#DDDDDD')}
                    />
                </div>

                {/* Status Pills (Airbnb Category Pill Group) */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        onClick={() => setStatusFilter('all')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            fontSize: '13px',
                            fontWeight: statusFilter === 'all' ? 600 : 500,
                            border: `1px solid ${statusFilter === 'all' ? '#222222' : '#DDDDDD'}`,
                            backgroundColor: statusFilter === 'all' ? '#222222' : '#FFFFFF',
                            color: statusFilter === 'all' ? '#FFFFFF' : '#222222',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Tous ({overview.totalCancelled})
                    </button>

                    <button
                        onClick={() => setStatusFilter('pending')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            fontSize: '13px',
                            fontWeight: statusFilter === 'pending' ? 600 : 500,
                            border: `1px solid ${statusFilter === 'pending' ? '#222222' : '#DDDDDD'}`,
                            backgroundColor: statusFilter === 'pending' ? '#222222' : '#FFFFFF',
                            color: statusFilter === 'pending' ? '#FFFFFF' : '#222222',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Clock size={13} color={statusFilter === 'pending' ? '#FFFFFF' : '#D97706'} />
                        <span>En attente ({overview.pendingCount})</span>
                    </button>

                    <button
                        onClick={() => setStatusFilter('completed')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            fontSize: '13px',
                            fontWeight: statusFilter === 'completed' ? 600 : 500,
                            border: `1px solid ${statusFilter === 'completed' ? '#222222' : '#DDDDDD'}`,
                            backgroundColor: statusFilter === 'completed' ? '#222222' : '#FFFFFF',
                            color: statusFilter === 'completed' ? '#FFFFFF' : '#222222',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <CheckCircle2 size={13} color={statusFilter === 'completed' ? '#FFFFFF' : '#16A34A'} />
                        <span>Remboursés ({overview.completedCount})</span>
                    </button>
                </div>

                {/* Dropdowns */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12.5px', color: '#717171', fontWeight: 500 }}>Politique :</span>
                        <select
                            value={policyFilter}
                            onChange={(e) => setPolicyFilter(e.target.value)}
                            style={{
                                height: '36px',
                                padding: '0 14px',
                                borderRadius: '9999px',
                                border: '1px solid #DDDDDD',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#222222',
                                backgroundColor: '#FFFFFF',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="all">Toutes</option>
                            <option value="flexible">Flexible</option>
                            <option value="moderate">Modérée</option>
                            <option value="strict">Stricte</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12.5px', color: '#717171', fontWeight: 500 }}>Annulé par :</span>
                        <select
                            value={initiatorFilter}
                            onChange={(e) => setInitiatorFilter(e.target.value)}
                            style={{
                                height: '36px',
                                padding: '0 14px',
                                borderRadius: '9999px',
                                border: '1px solid #DDDDDD',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#222222',
                                backgroundColor: '#FFFFFF',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="all">Tous</option>
                            <option value="host">Hôte (100% remboursé)</option>
                            <option value="guest">Voyageur</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EBEBEB',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    overflow: 'hidden'
                }}
            >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #EBEBEB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#222222', margin: 0 }}>
                            Dossiers de Virements & Remboursements
                        </h2>
                        <p style={{ fontSize: '12.5px', color: '#717171', margin: '2px 0 0 0' }}>
                            {refundsList.length} dossier{refundsList.length > 1 ? 's' : ''} trouvé{refundsList.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#717171', fontSize: '14px' }}>
                        Chargement des dossiers d'annulation...
                    </div>
                ) : refundsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#717171' }}>
                            <RotateCcw size={24} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#222222', margin: 0 }}>
                            Aucun virement en cours
                        </h3>
                        <p style={{ fontSize: '13.5px', color: '#717171', marginTop: '6px', maxWidth: '400px', margin: '6px auto 0 auto' }}>
                            Toutes les annulations ont été traitées ou aucun dossier ne correspond à vos filtres.
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Desktop Table View */}
                        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EBEBEB' }}>
                                        <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#717171' }}>
                                            Voyageur Bénéficiaire
                                        </th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#717171' }}>
                                            Logement & Séjour
                                        </th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#717171' }}>
                                            Condition & Auteur
                                        </th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#717171', textAlign: 'right' }}>
                                            Total Initial
                                        </th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#717171', textAlign: 'right' }}>
                                            À Rembourser
                                        </th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#717171' }}>
                                            Coordonnées RIB
                                        </th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#717171' }}>
                                            Statut
                                        </th>
                                        <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#717171', textAlign: 'right' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {refundsList.map((item: any) => {
                                        const isCompleted = item.refundStatus === 'completed';
                                        const isHostCancelled = item.cancelledByRole === 'host';
                                        const rib = item.rib;

                                        return (
                                            <tr
                                                key={item._id}
                                                style={{ borderBottom: '1px solid #F0F0F0', transition: 'background-color 0.15s ease' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                {/* Voyageur */}
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img
                                                            src={item.guest?.avatar || `https://ui-avatars.com/api/?name=${item.guest?.firstName || 'C'}+${item.guest?.lastName || 'L'}&background=FF385C&color=fff`}
                                                            alt=""
                                                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E5E7EB', flexShrink: 0 }}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#222222' }}>
                                                                {item.guest?.firstName} {item.guest?.lastName}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#717171', marginTop: '1px' }}>
                                                                {item.guest?.email || ''}
                                                            </div>
                                                            {item.guest?.phone && (
                                                                <div style={{ fontSize: '11.5px', color: '#717171' }}>
                                                                    {item.guest?.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Logement */}
                                                <td style={{ padding: '16px' }}>
                                                    <div>
                                                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#222222', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.listing?.title}>
                                                            {item.listing?.title || 'Logement'}
                                                        </span>
                                                        <span style={{ fontSize: '12px', color: '#717171', marginTop: '2px', display: 'block' }}>
                                                            {item.checkIn && item.checkOut
                                                                ? `${new Date(item.checkIn).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${new Date(item.checkOut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                                                : '-'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Condition & Auteur */}
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                        <span style={{ background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                                                            {translatePolicy(item.cancellationPolicy)}
                                                        </span>

                                                        <span
                                                            style={{
                                                                fontSize: '11px',
                                                                fontWeight: 600,
                                                                color: isHostCancelled ? '#B91C1C' : '#1D4ED8',
                                                                backgroundColor: isHostCancelled ? '#FEF2F2' : '#EFF6FF',
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                border: `1px solid ${isHostCancelled ? '#FEE2E2' : '#DBEAFE'}`
                                                            }}
                                                        >
                                                            {isHostCancelled ? "Annulé par l'hôte (100%)" : "Annulé par voyageur"}
                                                        </span>

                                                        {item.reason && (
                                                            <span
                                                                style={{ fontSize: '11px', color: '#717171', fontStyle: 'italic', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                                                                title={item.reason}
                                                            >
                                                                « {item.reason} »
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Total Initial */}
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <span style={{ fontSize: '13px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                                                        {item.totalPrice} €
                                                    </span>
                                                </td>

                                                {/* Montant à Rembourser */}
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '16px', color: item.refundAmount > 0 ? '#15803D' : '#DC2626', whiteSpace: 'nowrap' }}>
                                                            {item.refundAmount} €
                                                        </span>
                                                        {item.hostCancellationFee > 0 && (
                                                            <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                Pén. hôte : -{item.hostCancellationFee} €
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* RIB */}
                                                <td style={{ padding: '16px' }}>
                                                    {rib ? (
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '4px 8px' }}>
                                                            <CreditCard size={14} color="#008489" />
                                                            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '12px', fontWeight: 600, color: '#1F2937', letterSpacing: '0.5px' }}>
                                                                {rib}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyRib(rib)}
                                                                title="Copier le RIB"
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: copiedRib === rib ? '#16A34A' : '#9CA3AF', display: 'flex', alignItems: 'center' }}
                                                            >
                                                                {copiedRib === rib ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                                                            Non renseigné
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Statut Virement */}
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span
                                                            className={`status-badge ${isCompleted ? 'status-active' : 'status-pending'}`}
                                                            style={{ whiteSpace: 'nowrap' }}
                                                        >
                                                            {isCompleted ? (
                                                                <>
                                                                    <CheckCircle2 size={12} />
                                                                    <span>Virement émis</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock size={12} />
                                                                    <span>En attente RIB</span>
                                                                </>
                                                            )}
                                                        </span>
                                                        {isCompleted && (
                                                            <span style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                <Clock size={11} color="#6B7280" />
                                                                Délai banque : 1 à 3j
                                                            </span>
                                                        )}
                                                        {isCompleted && item.refundProcessedAt && (
                                                            <span style={{ fontSize: '10.5px', color: '#9CA3AF' }}>
                                                                Émis le {new Date(item.refundProcessedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                                        {!isCompleted ? (
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm(`Confirmer l'émission du virement de ${item.refundAmount}€ vers ${item.guest?.firstName} ${item.guest?.lastName} ?\n\nLe voyageur verra immédiatement sur son application que le virement a été émis (avec mention du délai bancaire de 1 à 3 jours ouvrés pour réception sur son compte).`)) {
                                                                        processRefundMutation.mutate({
                                                                            bookingId: item._id,
                                                                            refundStatus: 'completed'
                                                                        });
                                                                    }
                                                                }}
                                                                disabled={processRefundMutation.isPending}
                                                                style={{
                                                                    backgroundColor: '#10B981',
                                                                    color: '#FFFFFF',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    padding: '7px 14px',
                                                                    fontSize: '12.5px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)'
                                                                }}
                                                            >
                                                                <CheckCircle2 size={13} />
                                                                <span>Valider virement</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm(`Remettre ce virement en attente ?`)) {
                                                                        processRefundMutation.mutate({
                                                                            bookingId: item._id,
                                                                            refundStatus: 'pending'
                                                                        });
                                                                    }
                                                                }}
                                                                disabled={processRefundMutation.isPending}
                                                                style={{
                                                                    backgroundColor: '#FFFFFF',
                                                                    color: '#717171',
                                                                    border: '1px solid #E5E7EB',
                                                                    borderRadius: '8px',
                                                                    padding: '6px 12px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 500,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                En attente
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => setSelectedBookingForModal(item.booking || item)}
                                                            style={{
                                                                backgroundColor: '#FFFFFF',
                                                                color: '#222222',
                                                                border: '1px solid #D1D5DB',
                                                                borderRadius: '8px',
                                                                padding: '6px 12px',
                                                                fontSize: '12.5px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = '#222222';
                                                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = '#D1D5DB';
                                                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                                            }}
                                                        >
                                                            Ajuster
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Cancellation Refund Adjustment Modal */}
            {selectedBookingForModal && (
                <CancellationRefundModal
                    show={!!selectedBookingForModal}
                    booking={selectedBookingForModal}
                    onClose={() => setSelectedBookingForModal(null)}
                    onSave={(bookingId, data) => {
                        adjustMutation.mutate({ bookingId, data });
                    }}
                    isSaving={adjustMutation.isPending}
                />
            )}
        </div>
    );
};

export default ClientRefundsPage;
