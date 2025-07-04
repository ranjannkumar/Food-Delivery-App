import React, { useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import './Verify.css';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("sessionId");

  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  const verifyPayment = async () => {
    try {
      const response = await axios.post(
        `${url}/api/order/verify?success=${success}&orderId=${orderId}&sessionId=${sessionId}`
      );

      if (response.data.success) {
        navigate("/myorders");
      } else {
        console.error("Payment verification failed on backend:", response.data.message);
        navigate("/");
      }
    } catch (error) {
      console.error("Error during payment verification process:", error);
      navigate("/");
    }
  };

  useEffect(() => {
    if (orderId && success && sessionId) {
      verifyPayment();
    } else {
      console.warn("Verify component received incomplete query parameters. Redirecting.");
      navigate("/");
    }
  }, [orderId, success, sessionId, url, navigate]);

  return (
    <div className='verify'>
      <div className="spinner"></div>
      <p>Verifying your payment...</p>
    </div>
  );
};

export default Verify;

