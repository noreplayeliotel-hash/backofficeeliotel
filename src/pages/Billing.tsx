import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBillingSummary, markBookingsAsPaid, updateBooking } from '../services/adminService';
import { CreditCard, CheckCircle, Clock, Eye, X, Phone, Mail, ToggleLeft, ToggleRight, Search, ShieldAlert, AlertTriangle } from 'lucide-react';

const BillingPage: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewingHostId, setViewingHostId] = useState<string | null>(null);
    const [hostSearch, setHostSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [ribModalImage, setRibModalImage] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: billingSummary, isLoading } = useQuery({
        queryKey: ['billingSummary', selectedMonth, selectedYear],
        queryFn: () => getBillingSummary({ month: selectedMonth, year: selectedYear })
    });

    const mutation = useMutation({
        mutationFn: (bookingIds: string[]) => markBookingsAsPaid(bookingIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['billingSummary'] });
            setViewingHostId(null);
            alert('Paiement enregistré avec succès');
        },
        onError: (error: any) => {
            alert(`Erreur: ${error.response?.data?.message || error.message}`);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ bookingId, eliotelPaid }: { bookingId: string, eliotelPaid: boolean }) =>
            updateBooking(bookingId, { eliotelPaid }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['billingSummary'] });
        },
        onError: (error: any) => {
            alert(`Erreur: ${error.response?.data?.message || error.message}`);
        }
    });

    const viewingDetails = billingSummary?.find((item: any) => item.host._id === viewingHostId);

    const handlePay = (bookingIds: string[], netAmount: number = 0) => {
        if (netAmount <= 0) {
            if (window.confirm(`⚠️ Attention : Cet hôte a un solde net nul ou négatif (${netAmount.toLocaleString()} € suite aux pénalités d'annulation).\n\nAucun virement bancaire ne sera envoyé.\n\nVoulez-vous clôturer cette période et marquer les réservations comme traitées ?`)) {
                mutation.mutate(bookingIds);
            }
        } else {
            if (window.confirm(`Confirmer l'émission du virement bancaire de ${netAmount.toLocaleString()} € pour ${bookingIds.length} réservation(s) ?`)) {
                mutation.mutate(bookingIds);
            }
        }
    };

    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const filteredData = billingSummary?.filter((item: any) => {
        const searchLower = hostSearch.toLowerCase();
        const fullName = `${item.host.firstName} ${item.host.lastName}`.toLowerCase();
        return (
            item.host.firstName.toLowerCase().includes(searchLower) ||
            item.host.lastName.toLowerCase().includes(searchLower) ||
            item.host.email.toLowerCase().includes(searchLower) ||
            fullName.includes(searchLower)
        );
    }) || [];

    if (isLoading) return <div style={{ padding: '24px' }}>Chargement...</div>;

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Facturation Hôtes</h1>
                <p style={{ color: 'var(--light)', marginTop: '4px' }}>Gérez les paiements mensuels vers les propriétaires.</p>
            </div>

            <div className="card" style={{ marginBottom: '32px', padding: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="input-label">Mois</label>
                        <select
                            className="input-field"
                            style={{ marginBottom: 0 }}
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="input-label">Année</label>
                        <select
                            className="input-field"
                            style={{ marginBottom: 0 }}
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ height: '42px', padding: '0 24px' }}
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['billingSummary'] })}
                    >
                        Actualiser
                    </button>
                </div>

                <div style={{ marginTop: '16px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--light)' }} />
                    <input
                        type="text"
                        placeholder="Rechercher un hôte par nom, prénom ou email..."
                        className="input-field"
                        style={{ margin: 0, paddingLeft: '40px' }}
                        value={hostSearch}
                        onFocus={() => setShowSuggestions(true)}
                        onChange={(e) => {
                            setHostSearch(e.target.value);
                            setShowSuggestions(true);
                        }}
                    />

                    {hostSearch && showSuggestions && billingSummary && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            marginTop: '4px',
                            zIndex: 100,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            {billingSummary
                                .filter((item: any) => {
                                    const searchLower = hostSearch.toLowerCase();
                                    const fullName = `${item.host.firstName} ${item.host.lastName}`.toLowerCase();
                                    return fullName.includes(searchLower) || item.host.email.toLowerCase().includes(searchLower);
                                })
                                .map((item: any) => (
                                    <div
                                        key={item.host._id}
                                        onClick={() => {
                                            setHostSearch(`${item.host.firstName} ${item.host.lastName}`);
                                            setShowSuggestions(false);
                                        }}
                                        style={{
                                            padding: '10px 16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <img
                                            src={item.host.avatar || `https://ui-avatars.com/api/?name=${item.host.firstName}+${item.host.lastName}`}
                                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.host.firstName} {item.host.lastName}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--light)' }}>{item.host.email}</div>
                                        </div>
                                    </div>
                                ))}
                            {billingSummary.filter((item: any) => {
                                const searchLower = hostSearch.toLowerCase();
                                const fullName = `${item.host.firstName} ${item.host.lastName}`.toLowerCase();
                                return fullName.includes(searchLower) || item.host.email.toLowerCase().includes(searchLower);
                            }).length === 0 && (
                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--light)', fontSize: '14px' }}>
                                        Aucun exemple trouvé
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                {filteredData.length > 0 ? (
                    filteredData.map((item: any) => (
                        <div key={item.host._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <img
                                        src={item.host.avatar || `https://ui-avatars.com/api/?name=${item.host.firstName}+${item.host.lastName}&background=6366f1&color=fff`}
                                        alt="Host"
                                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                                    />
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px' }}>{item.host.firstName} {item.host.lastName}</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                            <p style={{ margin: 0, color: 'var(--light)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail size={12} /> {item.host.email}
                                            </p>
                                            {item.host.phone && (
                                                <p style={{ margin: 0, color: 'var(--light)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Phone size={12} /> {item.host.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {item.totalAmount > 0 ? (
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                                                Virement net à verser
                                            </div>
                                            <div style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a' }}>
                                                {item.totalAmount.toLocaleString()} €
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                                                Virement net à verser
                                            </div>
                                            <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
                                                0,00 €
                                            </div>
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: '#fef2f2',
                                                border: '1px solid #fecaca',
                                                color: '#dc2626',
                                                padding: '3px 10px',
                                                borderRadius: '16px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                marginTop: '4px'
                                            }}>
                                                <AlertTriangle size={13} /> Solde Débiteur : -{Math.abs(item.totalAmount).toLocaleString()} €
                                            </div>
                                        </div>
                                    )}
                                    {item.totalPenalties > 0 && (
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                            Revenus bruts: {(item.grossAmount || 0).toLocaleString()} € • Pénalités: -{(item.totalPenalties || 0).toLocaleString()} €
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                                        <span style={{ color: 'var(--light)', fontSize: '13px' }}>
                                            {item.bookingsCount} réservation(s)
                                        </span>
                                        <button
                                            onClick={() => setViewingHostId(item.host._id)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}
                                        >
                                            <Eye size={12} /> Détails
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {item.totalPenalties > 0 && (
                                <div style={{
                                    background: item.totalAmount <= 0 ? '#fff1f2' : '#fef2f2',
                                    border: `1px solid ${item.totalAmount <= 0 ? '#fecdd3' : '#fca5a5'}`,
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    color: '#9f1239',
                                    fontSize: '13px'
                                }}>
                                    <ShieldAlert size={20} color="#e11d48" style={{ flexShrink: 0 }} />
                                    <span>
                                        <strong>Pénalités d'annulation détectées :</strong> {item.totalPenalties} € déduits.
                                        {item.totalAmount < 0 ? (
                                            <> Comme l'hôte n'a pas de revenus locatifs suffisants ce mois-ci, son solde est négatif (<strong>-{Math.abs(item.totalAmount)} €</strong>). Aucun virement bancaire ne doit être émis. Ce solde débiteur sera compensé lors de ses prochains séjours.</>
                                        ) : (
                                            <> Les pénalités ont été directement retenues sur le montant du virement de ce mois.</>
                                        )}
                                    </span>
                                </div>
                            )}

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--light)' }}>
                                        <CreditCard size={18} />
                                        <span style={{ fontWeight: '600' }}>Coordonnées Bancaires (RIB)</span>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        {item.host.rib ? (
                                            <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '15px' }}>
                                                {item.host.rib}
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--error)', fontSize: '14px' }}>RIB non renseigné</div>
                                        )}
                                        {item.host.ribImage && (
                                            <button
                                                onClick={() => setRibModalImage(item.host.ribImage)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', color: 'var(--primary)', fontSize: '13px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', padding: 0 }}
                                            >
                                                <Eye size={14} /> Voir l'image du RIB
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                                    {item.totalAmount <= 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>
                                                Solde débiteur : aucun virement requis
                                            </div>
                                            <button
                                                onClick={() => handlePay(item.bookings.map((b: any) => b._id), item.totalAmount)}
                                                className="btn"
                                                style={{
                                                    height: '44px',
                                                    padding: '0 20px',
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    background: '#f1f5f9',
                                                    color: '#334155',
                                                    border: '1px solid #cbd5e1',
                                                    cursor: 'pointer'
                                                }}
                                                disabled={mutation.isPending}
                                            >
                                                <CheckCircle size={17} />
                                                {mutation.isPending ? 'Traitement...' : 'Clôturer sans virement (0 €)'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePay(item.bookings.map((b: any) => b._id), item.totalAmount)}
                                            className="btn btn-primary"
                                            style={{
                                                height: '48px',
                                                padding: '0 32px',
                                                fontSize: '15px',
                                                fontWeight: '700',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                background: 'linear-gradient(135deg, #E00B41 0%, #D70466 100%)'
                                            }}
                                            disabled={mutation.isPending}
                                        >
                                            <CheckCircle size={20} />
                                            {mutation.isPending ? 'Traitement...' : `Effectuer le virement (${item.totalAmount.toLocaleString()} €)`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--light)' }}>
                        <Clock size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3>Aucune facturation en attente</h3>
                        <p>Toutes les réservations terminées pour cette période ont déjà été payées.</p>
                    </div>
                )}
            </div>

            {/* Modal de Détails */}
            {viewingDetails && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 10 }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Détails des Réservations - {viewingDetails.host.firstName}</h2>
                            <button onClick={() => setViewingHostId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--light)' }}><X size={24} /></button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Annonce / Voyageur</th>
                                            <th>Dates</th>
                                            <th>Montant / Pénalité</th>
                                            <th>Payé ?</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingDetails.bookings.map((b: any) => {
                                            const isCancelled = b.status === 'cancelled';
                                            const isHostCancelled = b.cancellation?.cancelledByRole === 'host';
                                            const penalty = b.bookingPenalty || b.cancellation?.hostCancellationFee || 0;
                                            const payout = b.bookingPayout !== undefined ? b.bookingPayout : (isCancelled ? (b.cancellation?.hostPayoutAmount || 0) : Math.max(0, (b.total || 0) - (b.serviceFee || 0)));

                                            return (
                                                <tr key={b._id}>
                                                    <td>
                                                        <div style={{ fontWeight: '600' }}>{b.listing?.title || 'Annonce'}</div>
                                                        {isCancelled && (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                marginTop: '4px',
                                                                fontSize: '11px',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                background: isHostCancelled ? '#fee2e2' : '#dbeafe',
                                                                color: isHostCancelled ? '#991b1b' : '#1e40af',
                                                                fontWeight: 700
                                                            }}>
                                                                {isHostCancelled ? 'Annulée par l’hôte' : 'Annulée par le voyageur'}
                                                            </span>
                                                        )}
                                                        <div style={{ fontSize: '13px', marginTop: '6px' }}>
                                                            <div style={{ color: 'var(--primary)', fontWeight: '500' }}>{b.guest?.firstName} {b.guest?.lastName}</div>
                                                            <div style={{ color: 'var(--light)', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {b.guest?.email}</div>
                                                            {b.guest?.phone && <div style={{ color: 'var(--light)', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {b.guest?.phone}</div>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '13px' }}>
                                                            {new Date(b.checkIn).toLocaleDateString()}
                                                            <br />
                                                            au {new Date(b.checkOut).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {isHostCancelled && penalty > 0 ? (
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: '#dc2626' }}>
                                                                    -{penalty} €
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: '#991b1b' }}>
                                                                    (Pénalité hôte)
                                                                </div>
                                                            </div>
                                                        ) : isCancelled ? (
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: payout > 0 ? '#16a34a' : 'inherit' }}>
                                                                    {payout} €
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: 'var(--light)' }}>
                                                                    (Indemnité hôte)
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: '#0f172a' }}>
                                                                    {payout} €
                                                                </div>
                                                                {b.serviceFee > 0 && (
                                                                    <div style={{ fontSize: '11px', color: 'var(--light)', marginTop: '2px' }}>
                                                                        (Total {b.total} € - Frais {b.serviceFee} €)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => updateStatusMutation.mutate({ bookingId: b._id, eliotelPaid: !b.eliotelPaid })}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: b.eliotelPaid ? 'var(--success)' : 'var(--light)' }}
                                                        >
                                                            {b.eliotelPaid ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '13px' }}>
                                <div>
                                    <span style={{ color: 'var(--light)' }}>Revenus bruts : </span>
                                    <strong style={{ color: '#0f172a' }}>{(viewingDetails.grossAmount || 0).toLocaleString()} €</strong>
                                </div>
                                {(viewingDetails.totalPenalties || 0) > 0 && (
                                    <div>
                                        <span style={{ color: 'var(--light)' }}>Pénalités : </span>
                                        <strong style={{ color: '#dc2626' }}>-{(viewingDetails.totalPenalties || 0).toLocaleString()} €</strong>
                                    </div>
                                )}
                                <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
                                    <span style={{ color: 'var(--light)' }}>Virement net : </span>
                                    <strong style={{ fontSize: '15px', color: viewingDetails.totalAmount > 0 ? '#16a34a' : '#0f172a' }}>
                                        {Math.max(0, viewingDetails.totalAmount).toLocaleString()} €
                                    </strong>
                                    {viewingDetails.totalAmount < 0 && (
                                        <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: '700' }}>
                                            (Dette hôte : -{Math.abs(viewingDetails.totalAmount).toLocaleString()} €)
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn" onClick={() => setViewingHostId(null)}>Fermer</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handlePay(viewingDetails.bookings.map((b: any) => b._id), viewingDetails.totalAmount)}
                                    disabled={mutation.isPending}
                                    style={{
                                        background: viewingDetails.totalAmount <= 0 ? '#475569' : undefined
                                    }}
                                >
                                    {viewingDetails.totalAmount <= 0 ? 'Clôturer sans virement' : `Valider virement (${viewingDetails.totalAmount.toLocaleString()} €)`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal d'image RIB */}
            {ribModalImage && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
                    onClick={() => setRibModalImage(null)}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setRibModalImage(null)}
                            style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={ribModalImage}
                            alt="RIB"
                            style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPage;
