import React, { useEffect, useState, useCallback } from 'react'; 
import './Orders.css';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';

const Orders = ({ url }) => {
    const [orders, setOrders] = useState([]);
    const [showActionModal, setShowActionModal] = useState(false);
    const [currentOrderForAction, setCurrentOrderForAction] = useState(null);
    const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
    const [notes, setNotes] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [message, setMessage] = useState(''); 

    const adminToken = localStorage.getItem('adminToken') || ''; 

    const fetchAllOrders = useCallback(async () => {
        try {
            const response = await axios.get(url + "/api/order/list", {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (response.data.success) {
                setOrders(response.data.data);
                console.log("Fetched Orders:", response.data.data); 
            } else {
                toast.error("Error fetching orders");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to fetch orders.");
        }
    }, [url, adminToken]); 

    const statusHandler = async (event, orderId) => {
        try {
            const response = await axios.post(url + "/api/order/status", {
                orderId,
                status: event.target.value
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (response.data.success) {
                toast.success("Order status updated successfully!");
                await fetchAllOrders(); // Re-fetch after status update
            } else {
                toast.error("Error updating order status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update order status.");
        }
    };

    const handleOpenActionModal = (order, type) => {
        setCurrentOrderForAction(order);
        setActionType(type);
        setNotes('');
        setRefundAmount(order.amount ? order.amount.toFixed(2) : '');
        setMessage('');
        setShowActionModal(true);
    };

    const handleSubmitAction = async () => {
        if (actionType === 'approve' && (isNaN(parseFloat(refundAmount)) || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > currentOrderForAction.amount)) {
            setMessage('Please enter a valid refund amount.');
            return;
        }
        if (actionType === 'reject' && !notes.trim()) {
            setMessage('Please provide notes for rejecting the refund.');
            return;
        }

        try {
            let response;
            if (actionType === 'approve') {
                response = await axios.post(
                    `${url}/api/refunds/admin/approve/${currentOrderForAction._id}`,
                    { refundAmount: parseFloat(refundAmount), notes },
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                );
            } else { // reject
                response = await axios.post(
                    `${url}/api/refunds/admin/reject/${currentOrderForAction._id}`,
                    { notes },
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                );
            }

            if (response.data.success) {
                toast.success(response.data.message);
                setMessage('');
                setShowActionModal(false);
                await fetchAllOrders(); // Re-fetch orders to update status
            } else {
                setMessage(response.data.message);
                toast.error("Action failed: " + response.data.message);
            }
        } catch (error) {
            console.error(`Error ${actionType}ing refund:`, error);
            setMessage(error.response?.data?.message || `Failed to ${actionType} refund.`);
            toast.error(`Failed to ${actionType} refund.`);
        }
    };

    const canProcessRefund = (order) => {
        return order.refundStatus === 'REQUESTED' || order.refundStatus === 'PENDING_APPROVAL';
    };

    useEffect(() => {
        fetchAllOrders();

        const interval = setInterval(() => {
            fetchAllOrders();
        }, 5000); 

        return () => clearInterval(interval);
    }, [fetchAllOrders]); 

    return (
        <div className='order add'>
            <h3>Order Page</h3>
            <div className="order-list">
                {orders.length === 0 ? (
                    <p>No orders found.</p>
                ) : (
                    orders.map((order, index) => (
                        <div key={index} className="order-item">
                            <img src={assets.parcel_icon} alt="" />
                            <div>
                                <p className="order-item-food">
                                    {order.items.map((item, itemIndex) => (
                                        <span key={itemIndex}>
                                            {item.name} x {item.quantity}
                                            {itemIndex === order.items.length - 1 ? '' : ', '}
                                        </span>
                                    ))}
                                </p>
                                <p className="order-item-name">
                                    {order.address.firstName + " " + order.address.lastName}
                                </p>
                                <div className="order-item-address">
                                    <p>{order.address.street + ","}</p>
                                    <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                                </div>
                                <p className="order-item-phone">{order.address.phone}</p>
                            </div>
                            <p>Items : {order.items.length}</p>
                            <p>${order.amount}</p>

                            <select onChange={(event) => statusHandler(event, order._id)} value={order.status}>
                                <option value="Food Processing">Food Processing</option>
                                <option value="Out for delivery">Out for delivery</option>
                                <option value="Delivered">Delivered</option>
                            </select>

                            <div className="order-item-refund-section">
                                <p className={`refund-status ${order.refundStatus ? order.refundStatus.toLowerCase() : 'none'}`}>
                                    Refund: <b>{order.refundStatus || 'NONE'}</b>
                                    {order.refundAmount > 0 && ` ($${order.refundAmount.toFixed(2)})`}
                                </p>
                                {order.refundReason && <p className="refund-detail">User Reason: {order.refundReason}</p>}
                                {order.refundNotes && <p className="refund-detail">Admin Notes: {order.refundNotes}</p>}

                                {canProcessRefund(order) && (
                                    <div className="refund-action-buttons">
                                        <button className="approve-button" onClick={() => handleOpenActionModal(order, 'approve')}>Approve</button>
                                        <button className="reject-button" onClick={() => handleOpenActionModal(order, 'reject')}>Reject</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showActionModal && currentOrderForAction && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{actionType === 'approve' ? 'Approve' : 'Reject'} Refund for Order #{currentOrderForAction._id}</h3>
                        <p>Original Amount: ${currentOrderForAction.amount}.00</p>
                        <p>User Reason: {currentOrderForAction.refundReason || 'N/A'}</p>

                        {actionType === 'approve' && (
                            <label>
                                Refund Amount ($):
                                <input
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    min="0"
                                    max={currentOrderForAction.amount || 0}
                                    step="0.01"
                                />
                            </label>
                        )}
                        <label>
                            Admin/Merchant Notes:
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="4"
                                placeholder="Add notes for this action (e.g., reason for rejection, specific details of approval)."
                            ></textarea>
                        </label>
                        {message && <p className="modal-message">{message}</p>}
                        <div className="modal-actions">
                            <button onClick={handleSubmitAction}>Confirm {actionType}</button>
                            <button onClick={() => setShowActionModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;


