import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Home,
    CalendarDays,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    RotateCcw,
    CreditCard,
    ArrowRight,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getAllReports } from '../services/adminService';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    const { data: statsData, isLoading } = useQuery({
        queryKey: ['adminStats'],
        queryFn: getDashboardStats
    });

    const { data: reportsData, isLoading: isLoadingReports } = useQuery({
        queryKey: ['adminReportsHome'],
        queryFn: () => getAllReports({ limit: 5 })
    });

    if (isLoading) return <div className="loading-container">Chargement...</div>;

    const stats = [
        { label: 'Utilisateurs', value: statsData?.overview?.totalUsers || 0, icon: <Users />, change: '', isPositive: true },
        { label: 'Annonces', value: statsData?.overview?.totalListings || 0, icon: <Home />, change: '', isPositive: true },
        { label: 'Réservations', value: statsData?.overview?.totalBookings || 0, icon: <CalendarDays />, change: '', isPositive: false },
        { label: 'Revenus', value: `${(statsData?.overview?.totalRevenue || 0).toLocaleString()}€`, icon: <TrendingUp />, change: '', isPositive: true },
        {
            label: 'Remboursements Clients',
            value: `${(statsData?.overview?.totalClientRefunds || 0).toLocaleString()}€`,
            icon: <RotateCcw />,
            change: statsData?.overview?.pendingClientRefundsCount
                ? `${statsData.overview.pendingClientRefundsCount} en attente (${(statsData.overview.pendingClientRefunds || 0).toLocaleString()}€)`
                : 'Tous réglés',
            isPositive: !statsData?.overview?.pendingClientRefundsCount
        },
    ];

    const recentBookings = statsData?.recentBookings || [];
    const clientRefunds = statsData?.clientRefunds || [];

    const translateStatus = (status: string) => {
        const translations: { [key: string]: string } = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'cancelled': 'Annulée',
            'completed': 'Terminée',
            'rejected': 'Refusée'
        };
        return translations[status] || status;
    };

    const translatePolicy = (policy: string) => {
        const p = policy?.toLowerCase();
        if (p === 'flexible') return 'Flexible';
        if (p === 'moderate' || p === 'moderee') return 'Modérée';
        if (p === 'strict' || p === 'stricte') return 'Stricte';
        return policy || 'Flexible';
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <h1 className="dashboard-title">Tableau de bord</h1>
                    <p className="dashboard-subtitle">Bienvenue dans votre espace d'administration.</p>
                </div>
                <button className="btn btn-primary dashboard-export-btn">
                    <span className="desktop-only">Exporter les données</span>
                    <span className="mobile-only">Exporter</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-stats-grid">
                {stats.map((stat, idx) => (
                    <div key={idx} className="dashboard-stat-card card">
                        <div className="dashboard-stat-header">
                            <div className="dashboard-stat-icon">
                                {stat.icon}
                            </div>
                            {stat.change && (
                                <div className={`dashboard-stat-change ${stat.isPositive ? 'positive' : 'negative'}`}>
                                    {stat.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    {stat.change}
                                </div>
                            )}
                        </div>
                        <div className="dashboard-stat-content">
                            <h3 className="dashboard-stat-label">{stat.label}</h3>
                            <p className="dashboard-stat-value">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content-grid">
                {/* Recent Bookings */}
                <div className="card dashboard-bookings-card">
                    <h2 className="dashboard-section-title">Réservations récentes</h2>
                    <div className="dashboard-table-wrapper">
                        <div className="table-container">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th className="hide-mobile">Annonce</th>
                                        <th className="hide-mobile">Dates</th>
                                        <th>Total</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="dashboard-empty-state">
                                                Aucune réservation récente
                                            </td>
                                        </tr>
                                    ) : (
                                        recentBookings.map((booking: any) => (
                                            <tr key={booking._id} className="dashboard-table-row">
                                                <td>
                                                    <div className="dashboard-client-cell">
                                                        <img
                                                            src={booking.guest?.avatar || `https://ui-avatars.com/api/?name=${booking.guest?.firstName}+${booking.guest?.lastName}`}
                                                            alt=""
                                                            className="dashboard-client-avatar"
                                                        />
                                                        <div className="dashboard-client-info">
                                                            <span className="dashboard-client-name">
                                                                {booking.guest?.firstName} {booking.guest?.lastName}
                                                            </span>
                                                            <span className="dashboard-client-listing mobile-only">
                                                                {booking.listing?.title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hide-mobile">
                                                    <span className="dashboard-listing-title">
                                                        {booking.listing?.title}
                                                    </span>
                                                </td>
                                                <td className="hide-mobile dashboard-dates-cell">
                                                    {new Date(booking.checkIn).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - {new Date(booking.checkOut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                                </td>
                                                <td className="dashboard-total-cell">{booking.pricing?.total} €</td>
                                                <td>
                                                    <span className={`status-badge ${booking.status === 'confirmed' || booking.status === 'completed' ? 'status-active' : booking.status === 'pending' ? 'status-pending' : 'status-cancelled'}`}>
                                                        {translateStatus(booking.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Reports */}
                <div className="card dashboard-reports-card">
                    <h2 className="dashboard-section-title">Derniers signalements</h2>
                    <div className="dashboard-reports-list">
                        {isLoadingReports ? (
                            <p className="dashboard-loading-text">Chargement des signalements...</p>
                        ) : reportsData?.reports?.length > 0 ? (
                            reportsData.reports.slice(0, 5).map((report: any) => (
                                <div key={report._id} className="dashboard-report-item">
                                    <div className="dashboard-report-header">
                                        <span className="dashboard-report-reason">{report.reason}</span>
                                        <span className="dashboard-report-date">
                                            {new Date(report.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="dashboard-report-description">
                                        Signalé par {report.reporter?.firstName} sur {report.reportedUser ? `l'utilisateur ${report.reportedUser.firstName}` : `l'annonce ${report.reportedListing?.title}`}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="dashboard-empty-text">Aucun signalement récent.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Section Virements & Remboursements Clients (Annulations) */}
            <div className="card dashboard-refunds-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RotateCcw size={20} color="var(--primary, #FF385C)" />
                            <h2 className="dashboard-section-title" style={{ margin: 0 }}>
                                Remboursements & Virements Clients (Annulations)
                            </h2>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--light, #717171)' }}>
                            Montants des virements à retourner aux clients selon les conditions d'annulation (Flexible, Modérée, Stricte ou annulation par l'hôte à 100%)
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/admin/refunds')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
                    >
                        <span>Gérer les remboursements</span>
                        <ArrowRight size={14} />
                    </button>
                </div>

                <div className="dashboard-table-wrapper">
                    <div className="table-container">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Client (Bénéficiaire)</th>
                                    <th className="hide-mobile">Annonce</th>
                                    <th>Condition & Auteur</th>
                                    <th>Total Réservation</th>
                                    <th>Montant Remboursement</th>
                                    <th>Virement (RIB Client)</th>
                                    <th>Statut Virement</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientRefunds.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="dashboard-empty-state">
                                            Aucun remboursement client en cours pour les réservations annulées.
                                        </td>
                                    </tr>
                                ) : (
                                    clientRefunds.map((refund: any) => {
                                        const isCompleted = refund.refundStatus === 'completed';
                                        const isHostCancelled = refund.cancelledByRole === 'host';

                                        return (
                                            <tr key={refund._id} className="dashboard-table-row">
                                                <td>
                                                    <div className="dashboard-client-cell">
                                                        <img
                                                            src={refund.guest?.avatar || `https://ui-avatars.com/api/?name=${refund.guest?.firstName || 'C'}+${refund.guest?.lastName || 'L'}`}
                                                            alt=""
                                                            className="dashboard-client-avatar"
                                                        />
                                                        <div className="dashboard-client-info">
                                                            <span className="dashboard-client-name">
                                                                {refund.guest?.firstName} {refund.guest?.lastName}
                                                            </span>
                                                            <span style={{ fontSize: '12px', color: 'var(--light)' }}>
                                                                {refund.guest?.email || refund.guest?.phone || ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hide-mobile">
                                                    <span className="dashboard-listing-title">
                                                        {refund.listing?.title || 'Logement'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '13px' }}>
                                                            {translatePolicy(refund.cancellationPolicy)}
                                                        </span>
                                                        <span style={{ fontSize: '11px', color: isHostCancelled ? '#C82333' : '#717171' }}>
                                                            {isHostCancelled ? "Annulé par l'hôte (100%)" : 'Annulé par le voyageur'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '13px', color: 'var(--light)', textDecoration: 'line-through' }}>
                                                        {refund.totalPrice} €
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 700, fontSize: '15px', color: refund.refundAmount > 0 ? '#1E7E34' : '#C82333' }}>
                                                        {refund.refundAmount} €
                                                    </span>
                                                </td>
                                                <td>
                                                    {refund.rib ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <CreditCard size={14} color="#0061C1" />
                                                            <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#F0F4F8', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                                                                {refund.rib}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: 'var(--light)', fontStyle: 'italic' }}>
                                                            Non renseigné
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${isCompleted ? 'status-active' : 'status-pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        {isCompleted ? (
                                                            <>
                                                                <CheckCircle2 size={12} />
                                                                Remboursé
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Clock size={12} />
                                                                En attente de virement
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => navigate('/admin/bookings')}
                                                        style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
                                                    >
                                                        Gérer
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
            </div>
        </div>
    );
};

export default Dashboard;
