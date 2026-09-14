import React, { useState } from 'react';
import { Edit2, Check, X, Phone, Trash2, Copy, CheckCircle, ShieldAlert, Home } from 'lucide-react';
import type { Booking } from '../../types';

interface BookingTableProps {
    bookings: Booking[];
    translateStatus: (status: string) => string;
    getStatusColor: (status: string) => string;
    // Dates
    editingDates: string | null;
    editCheckIn: string;
    editCheckOut: string;
    setEditCheckIn: (value: string) => void;
    setEditCheckOut: (value: string) => void;
    onStartEditDates: (booking: Booking) => void;
    onSaveDates: (bookingId: string) => void;
    onCancelEdit: () => void;
    // Price
    editingPrice: string | null;
    editPrice: string;
    setEditPrice: (value: string) => void;
    onStartEditPrice: (booking: Booking) => void;
    onSavePrice: (bookingId: string) => void;
    onCancelEditPrice: () => void;
    // Other
    onStatusChange: (bookingId: string, status: string) => void;
    onPaymentStatusChange: (bookingId: string, paymentStatus: string) => void;
    onDelete: (bookingId: string) => void;
    onOpenCancellationModal?: (booking: Booking) => void;
}

const BookingTable: React.FC<BookingTableProps> = ({
    bookings,
    translateStatus,
    getStatusColor,
    editingDates,
    editCheckIn,
    editCheckOut,
    setEditCheckIn,
    setEditCheckOut,
    onStartEditDates,
    onSaveDates,
    onCancelEdit,
    editingPrice,
    editPrice,
    setEditPrice,
    onStartEditPrice,
    onSavePrice,
    onCancelEditPrice,
    onStatusChange,
    onPaymentStatusChange,
    onDelete,
    onOpenCancellationModal,
}) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyPaymentLink = async (bookingId: string, paymentLink: string) => {
        try {
            await navigator.clipboard.writeText(paymentLink);
            setCopiedId(bookingId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            alert('Erreur lors de la copie du lien');
        }
    };

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Annonce</th>
                            <th>Voyageur</th>
                            <th>Hôte</th>
                            <th>Dates</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th>Statut</th>
                            <th>Paiement</th>
                            <th>Lien Paiement</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => {
                            const listingImg = typeof booking.listing === 'object' && booking.listing?.images?.length
                                ? (booking.listing.images.find((img: any) => img.isPrimary)?.url || booking.listing.images[0]?.url)
                                : null;
                            const isCancelled = booking.status === 'cancelled';
                            const isHostCancelled = booking.cancellation?.cancelledByRole === 'host';

                            return (
                                <tr key={booking._id}>
                                    {/* Annonce */}
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {listingImg ? (
                                                <img
                                                    src={listingImg}
                                                    alt=""
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #EBEBEB', flexShrink: 0 }}
                                                />
                                            ) : (
                                                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #EBEBEB' }}>
                                                    <Home size={18} color="#9CA3AF" />
                                                </div>
                                            )}
                                            <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#222222', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={typeof booking.listing === 'object' ? booking.listing.title : ''}>
                                                {typeof booking.listing === 'object' ? booking.listing.title : 'ID: ' + booking.listing}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Voyageur */}
                                    <td>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '13.5px', color: '#222222', margin: 0 }}>
                                                {typeof booking.guest === 'object' ? `${booking.guest.firstName} ${booking.guest.lastName}` : 'ID: ' + booking.guest}
                                            </p>
                                            {typeof booking.guest === 'object' && (
                                                <div style={{ fontSize: '12px', color: '#717171', marginTop: '2px' }}>
                                                    <p style={{ margin: 0 }}>{booking.guest.email}</p>
                                                    {booking.guest.phone && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px', fontSize: '11.5px' }}>
                                                            <Phone size={10} /><span>{booking.guest.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Hôte */}
                                    <td>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '13.5px', color: '#222222', margin: 0 }}>
                                                {typeof booking.host === 'object' ? `${booking.host.firstName} ${booking.host.lastName}` : 'ID: ' + booking.host}
                                            </p>
                                            {typeof booking.host === 'object' && (
                                                <div style={{ fontSize: '12px', color: '#717171', marginTop: '2px' }}>
                                                    <p style={{ margin: 0 }}>{booking.host.email}</p>
                                                    {booking.host.phone && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px', fontSize: '11.5px' }}>
                                                            <Phone size={10} /><span>{booking.host.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Dates */}
                                    <td>
                                        {editingDates === booking._id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    style={{ padding: '4px 6px', fontSize: '12px', marginBottom: 0, height: '28px' }}
                                                    value={editCheckIn}
                                                    onChange={(e) => setEditCheckIn(e.target.value)}
                                                />
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    style={{ padding: '4px 6px', fontSize: '12px', marginBottom: 0, height: '28px' }}
                                                    value={editCheckOut}
                                                    onChange={(e) => setEditCheckOut(e.target.value)}
                                                />
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => onSaveDates(booking._id)} className="table-btn-icon" style={{ height: '26px', width: '26px', color: '#16A34A' }}><Check size={14} /></button>
                                                    <button onClick={onCancelEdit} className="table-btn-icon" style={{ height: '26px', width: '26px', color: '#DC2626' }}><X size={14} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ fontSize: '12.5px' }}>
                                                    <span style={{ fontWeight: 500, color: '#222222', display: 'block' }}>{new Date(booking.checkIn).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                    <span style={{ color: '#717171', fontSize: '11.5px', display: 'block' }}>au {new Date(booking.checkOut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                </div>
                                                <button
                                                    onClick={() => onStartEditDates(booking)}
                                                    className="table-btn-icon"
                                                    style={{ width: '26px', height: '26px', border: 'none', background: 'transparent' }}
                                                    title="Modifier les dates"
                                                >
                                                    <Edit2 size={12} color="#9CA3AF" />
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    {/* Total */}
                                    <td style={{ textAlign: 'right' }}>
                                        {editingPrice === booking._id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="0"
                                                    step="0.01"
                                                    style={{ padding: '4px 6px', fontSize: '12px', width: '80px', height: '28px', marginBottom: 0 }}
                                                    value={editPrice}
                                                    onChange={(e) => setEditPrice(e.target.value)}
                                                />
                                                <button onClick={() => onSavePrice(booking._id)} className="table-btn-icon" style={{ height: '26px', width: '26px', color: '#16A34A' }}><Check size={14} /></button>
                                                <button onClick={onCancelEditPrice} className="table-btn-icon" style={{ height: '26px', width: '26px', color: '#DC2626' }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#222222', whiteSpace: 'nowrap' }}>
                                                    {booking.pricing.total} {booking.pricing.currency === 'EUR' ? '€' : (booking.pricing.currency || '€')}
                                                </span>
                                                <button
                                                    onClick={() => onStartEditPrice(booking)}
                                                    className="table-btn-icon"
                                                    style={{ width: '24px', height: '24px', border: 'none', background: 'transparent' }}
                                                    title="Modifier le prix"
                                                >
                                                    <Edit2 size={12} color="#9CA3AF" />
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    {/* Statut réservation (Airbnb clean badges) */}
                                    <td>
                                        {isCancelled ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                {/* Initiator badge */}
                                                <span
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        backgroundColor: isHostCancelled ? '#FEF2F2' : '#EFF6FF',
                                                        color: isHostCancelled ? '#991B1B' : '#1E40AF',
                                                        border: `1px solid ${isHostCancelled ? '#FEE2E2' : '#DBEAFE'}`,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {isHostCancelled ? 'Annulée (Hôte)' : 'Annulée (Voyageur)'}
                                                </span>

                                                {/* Financial summary on clean single line */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                    <span style={{ color: '#2563EB', fontWeight: 600 }}>
                                                        Remb. {booking.cancellation?.refundAmount !== undefined ? booking.cancellation.refundAmount : (isHostCancelled ? booking.pricing.total : 0)} €
                                                    </span>
                                                    {booking.cancellation?.hostCancellationFee ? (
                                                        <span style={{ color: '#DC2626', fontWeight: 600 }}>
                                                            • Pén. -{booking.cancellation.hostCancellationFee} €
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {/* Status pill & Manage button */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <span
                                                        className={`status-badge ${booking.cancellation?.refundStatus === 'completed' ? 'status-active' : 'status-pending'}`}
                                                        style={{ fontSize: '10.5px', padding: '2px 7px' }}
                                                    >
                                                        {booking.cancellation?.refundStatus === 'completed' ? 'Remboursé' : 'En attente'}
                                                    </span>

                                                    {onOpenCancellationModal && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onOpenCancellationModal(booking)}
                                                            className="table-btn-icon primary"
                                                            style={{ height: '24px', padding: '0 8px', width: 'auto', fontSize: '11px', fontWeight: 600, gap: '4px' }}
                                                            title="Gérer l'annulation et les pénalités"
                                                        >
                                                            <ShieldAlert size={12} />
                                                            <span>Gérer</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                                {translateStatus(booking.status)}
                                            </span>
                                        )}
                                    </td>

                                    {/* Paiement */}
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                            <span
                                                style={{
                                                    fontSize: '11.5px',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontWeight: 600,
                                                    background: (!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#FEF9C3' : '#EFF6FF',
                                                    color: (!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#854D0E' : '#1D4ED8',
                                                    border: `1px solid ${(!booking.paymentMethod || booking.paymentMethod === 'cash') ? '#FDE047' : '#BFDBFE'}`,
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {booking.paymentMethod === 'stripe' ? '💳 Carte' : booking.paymentMethod === 'konnect' ? '💳 Konnect' : '💵 Espèces'}
                                            </span>

                                            <select
                                                value={booking.paymentStatus}
                                                onChange={(e) => onPaymentStatusChange(booking._id, e.target.value)}
                                                className="table-select"
                                                style={{ height: '28px', fontSize: '11.5px' }}
                                            >
                                                <option value="pending">En attente</option>
                                                <option value="paid">Payé</option>
                                                <option value="refunded">Remboursé</option>
                                                <option value="failed">Échoué</option>
                                            </select>
                                        </div>
                                    </td>

                                    {/* Lien de paiement */}
                                    <td>
                                        {booking.paymentLink ? (
                                            <button
                                                onClick={() => handleCopyPaymentLink(booking._id, booking.paymentLink!)}
                                                className="table-btn-icon"
                                                style={{
                                                    height: '30px',
                                                    width: 'auto',
                                                    padding: '0 10px',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    gap: '5px',
                                                    color: copiedId === booking._id ? '#16A34A' : '#2563EB',
                                                    backgroundColor: copiedId === booking._id ? '#DEF7EC' : '#F0F9FF',
                                                    borderColor: copiedId === booking._id ? '#BCF0DA' : '#BFDBFE'
                                                }}
                                                title={booking.paymentLink}
                                            >
                                                {copiedId === booking._id ? <><CheckCircle size={13} /> Copié</> : <><Copy size={13} /> Copier</>}
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>—</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                            <select
                                                value={booking.status}
                                                onChange={(e) => onStatusChange(booking._id, e.target.value)}
                                                className="table-select"
                                                style={{ height: '32px', width: '105px' }}
                                            >
                                                <option value="pending">En attente</option>
                                                <option value="confirmed">Confirmée</option>
                                                <option value="completed">Terminée</option>
                                                <option value="cancelled">Annulée</option>
                                                <option value="rejected">Refusée</option>
                                            </select>

                                            {onOpenCancellationModal && (
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenCancellationModal(booking)}
                                                    className="table-btn-icon primary"
                                                    title="Gérer l'annulation et le remboursement"
                                                >
                                                    <ShieldAlert size={15} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => onDelete(booking._id)}
                                                className="table-btn-icon danger"
                                                title="Supprimer la réservation"
                                            >
                                                <Trash2 size={15} />
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
    );
};

export default BookingTable;
