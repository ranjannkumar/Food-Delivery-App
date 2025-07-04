import React, { useState, useContext, useEffect } from 'react';
import './MyOrder.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';

const MyOrder = () => {
    const { url, token } = useContext(StoreContext);
    const [data, setData] = useState([]);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [currentOrderForRefund, setCurrentOrderForRefund] = useState(null);
    const [refundReason, setRefundReason] = useState('');
    const [message, setMessage] = useState('');

    const fetchOrders = async () => {
        try {
            const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setMessage("Failed to load your orders.");
        }
    };

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token]);

    const handleOpenRefundModal = (order) => {
        setCurrentOrderForRefund(order);
        setShowRefundModal(true);
        setRefundReason('');
        setMessage('');
    };

    const handleSubmitRefundRequest = async () => {
        if (!refundReason.trim()) {
            setMessage('Please provide a reason for the refund.');
            return;
        }
        if (!currentOrderForRefund) {
            setMessage('No order selected for refund.');
            return;
        }

        try {
            const response = await axios.post(
                `${url}/api/refunds/orders/${currentOrderForRefund._id}/request`,
                { reason: refundReason },
                { headers: { token } }
            );

            if (response.data.success) {
                setMessage(response.data.message);
                setData(prevData => prevData.map(order =>
                    order._id === currentOrderForRefund._id ? response.data.order : order
                ));
                setShowRefundModal(false);
                setCurrentOrderForRefund(null);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error submitting refund request:", error);
            setMessage(error.response?.data?.message || "Failed to submit refund request.");
        }
    };

    const canRequestRefund = (order) => {
        // Ensure 'payment' is true and status is 'Delivered' or 'Cancelled'
        // Also ensure refundStatus is not already in a processing/completed state
        return order.payment &&
               (order.status === 'Delivered' || order.status === 'Cancelled') &&
               (order.refundStatus === 'NONE' || order.refundStatus === 'REJECTED' || order.refundStatus === 'FAILED');
    };

    return (
        <div className='my-orders'>
            <h2>My Orders</h2>
            <div className="container">
                {data.length === 0 ? (
                    <p>No orders found.</p>
                ) : (
                    data.map((order, index) => (
                        <div key={index} className="my-orders-order">
                            <img src={assets.parcel_icon} alt="" />
                            <p>
                                {order.items.map((item, itemIndex) => (
                                    <span key={itemIndex}>
                                        {item.name} x {item.quantity}
                                        {itemIndex === order.items.length - 1 ? '' : ', '}
                                    </span>
                                ))}
                            </p>
                            <p>${order.amount}.00</p>
                            <p>Items: {order.items.length}</p>
                            <p><span>&#x25cf;</span> <b>{order.status}</b></p>

                            {/* Display Refund Status */}
                            {order.refundStatus !== 'NONE' && (
                                <p className={`refund-status ${order.refundStatus.toLowerCase()}`}>
                                    Refund Status: <b>{order.refundStatus}</b>
                                    {order.refundAmount > 0 && ` ($${order.refundAmount.toFixed(2)})`}
                                    {order.refundNotes && ` - ${order.refundNotes}`}
                                </p>
                            )}

                            {/* Request Refund Button - Ensure it's on its own line if needed */}
                            <div className="order-actions"> {/* NEW div to group buttons */}
                                {canRequestRefund(order) && (
                                    <button className="request-refund-button" onClick={() => handleOpenRefundModal(order)}>Request Refund</button>
                                )}
                                <button className="track-order-button" onClick={fetchOrders}>Track Order</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Refund Request Modal */}
            {showRefundModal && currentOrderForRefund && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Request Refund for Order #{currentOrderForRefund._id}</h3>
                        <p>Total Amount: ${currentOrderForRefund.amount}.00</p>
                        <textarea
                            placeholder="Please provide a detailed reason for your refund request (e.g., wrong item, late delivery)."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            rows="5"
                        ></textarea>
                        {message && <p className="modal-message">{message}</p>}
                        <div className="modal-actions">
                            <button onClick={handleSubmitRefundRequest}>Submit Request</button>
                            <button onClick={() => setShowRefundModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrder;



