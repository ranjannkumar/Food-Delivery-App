    import React, { useState, useEffect } from 'react';
    import axios from 'axios';

    const RefundManagementPage = () => {
        const [pendingRefunds, setPendingRefunds] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');
        const [message, setMessage] = useState('');
        const [showActionModal, setShowActionModal] = useState(false);
        const [currentOrder, setCurrentOrder] = useState(null);
        const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
        const [notes, setNotes] = useState('');
        const [refundAmount, setRefundAmount] = useState(''); 


        useEffect(() => {
            fetchPendingRefunds();
        }, []);

        const fetchPendingRefunds = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/refunds/admin/pending`); 
                setPendingRefunds(res.data.orders);
            } catch (err) {
                console.error('Error fetching pending refunds:', err);
                setError('Failed to load pending refund requests.');
            } finally {
                setLoading(false);
            }
        };

        const openActionModal = (order, type) => {
            setCurrentOrder(order);
            setActionType(type);
            setNotes('');
            setRefundAmount(order.amount ? order.amount.toFixed(2) : '');
            setShowActionModal(true);
        };

        const handleAction = async () => {
            try {
                let res;
                if (actionType === 'approve') {
                    res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/refunds/admin/approve/${currentOrder._id}`,
                        { refundAmount: parseFloat(refundAmount), notes }
                    );
                } else { 
                    res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/refunds/admin/reject/${currentOrder._id}`,
                        { notes }
                    );
                }
                setMessage(res.data.message);
                if (res.data.success) {
                    setShowActionModal(false);
                    fetchPendingRefunds();
                }
            } catch (err) {
                console.error(`Error ${actionType}ing refund:`, err);
                setMessage(err.response?.data?.message || `Failed to ${actionType} refund.`);
            }
        };

        if (loading) return <div>Loading pending refunds...</div>;
        if (error) return <div>Error: {error}</div>;

        return (
            <div className="admin-refunds-container">
                <h2>Refund Requests for Review</h2>
                {message && <p className="message">{message}</p>}

                {pendingRefunds.length === 0 ? (
                    <p>No pending refund requests at the moment.</p>
                ) : (
                    <ul className="refund-list">
                        {pendingRefunds.map(order => (
                            <li key={order._id} className="refund-item">
                                <h3>Order ID: {order._id}</h3>
                                <p>User ID: {order.userId} (You might fetch user details separately)</p>
                                <p>Order Total: ${order.amount ? order.amount.toFixed(2) : 'N/A'}</p>
                                <p>User Reason: {order.refundReason}</p>
                                <p>Requested On: {new Date(order.refundRequestedAt).toLocaleDateString()}</p>
                                <div className="actions">
                                    <button onClick={() => openActionModal(order, 'approve')}>Approve</button>
                                    <button onClick={() => openActionModal(order, 'reject')}>Reject</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {showActionModal && currentOrder && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>{actionType === 'approve' ? 'Approve' : 'Reject'} Refund for Order #{currentOrder._id}</h3>
                            {actionType === 'approve' && (
                                <label>
                                    Refund Amount ($):
                                    <input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        min="0"
                                        max={currentOrder.amount || 0}
                                        step="0.01"
                                    />
                                </label>
                            )}
                            <label>
                                Notes (for internal record/user notification):
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows="4"
                                ></textarea>
                            </label>
                            <div className="modal-actions">
                                <button onClick={handleAction}>Confirm {actionType}</button>
                                <button onClick={() => setShowActionModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    export default RefundManagementPage;
    

    