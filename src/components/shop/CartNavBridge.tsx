import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

/** Redirects legacy openCart() calls to the full cart page */
const CartNavBridge = () => {
  const navigate = useNavigate();
  const { isCartOpen, closeCart } = useCart();

  useEffect(() => {
    if (isCartOpen) {
      navigate('/cart');
      closeCart();
    }
  }, [isCartOpen, navigate, closeCart]);

  return null;
};

export default CartNavBridge;
