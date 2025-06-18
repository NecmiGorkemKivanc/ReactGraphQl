import React, { useState, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_PRODUCT_BY_SKU = gql`
  query GetProductBySku($sku: String!) {
    products(filter: { sku: { eq: $sku } }) {
      items {
        sku
        name
        stock_status
        brand
        image {
          url
          label
        }
        price_range {
          minimum_price {
            final_price {
              value
              currency
            }
          }
        }
      }
    }
  }
`;

const CREATE_GUEST_CART = gql`
  mutation {
    createGuestCart {
      cart {
        id
      }
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddSimpleProductToCart($cartId: String!, $sku: String!, $quantity: Float!) {
    addSimpleProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [
          {
            data: {
              sku: $sku
              quantity: $quantity
            }
          }
        ]
      }
    ) {
      cart {
        itemsV2 {
          items {
            id
            product {
              sku
              name
              image {
                url
              }
              price_range {
                minimum_price {
                  final_price {
                    value
                    currency
                  }
                }
              }
            }
            quantity
          }
        }
      }
    }
  }
`;

const REMOVE_FROM_CART = gql`
  mutation RemoveCartItem($cartId: String!, $itemId: Int!) {
    removeItemFromCart(input: { cart_id: $cartId, cart_item_id: $itemId }) {
      cart {
        itemsV2 {
          items {
            id
            quantity
            product {
              sku
              name
              image {
                url
              }
              price_range {
                minimum_price {
                  final_price {
                    value
                    currency
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const UPDATE_CART_ITEM_QUANTITY = gql`
  mutation UpdateCartItemQuantity($cartId: String!, $itemId: Int!, $quantity: Float!) {
    updateCartItems(
      input: {
        cart_id: $cartId
        cart_items: [{ cart_item_id: $itemId, quantity: $quantity }]
      }
    ) {
      cart {
        itemsV2 {
          items {
            id
            quantity
            product {
              sku
              name
              image {
                url
              }
              price_range {
                minimum_price {
                  final_price {
                    value
                    currency
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function ProductView({ sku }) {
    const [cartId, setCartId] = useState(null);
    const [message, setMessage] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [minicartOpen, setMinicartOpen] = useState(false);
    const minicartRef = useRef(null);

    const { loading, error, data } = useQuery(GET_PRODUCT_BY_SKU, { variables: { sku } });
    const [createCart] = useMutation(CREATE_GUEST_CART);
    const [addToCart, { loading: addingToCart }] = useMutation(ADD_TO_CART);
    const [removeFromCart] = useMutation(REMOVE_FROM_CART);
    const [updateCartQuantity] = useMutation(UPDATE_CART_ITEM_QUANTITY);

    React.useEffect(() => {
        const initializeCart = async () => {
            let existingCartId = localStorage.getItem('cart_id');
            if (!existingCartId) {
                try {
                    const response = await createCart();
                    existingCartId = response.data.createGuestCart.cart.id;
                    localStorage.setItem('cart_id', existingCartId);
                } catch (e) {
                    setMessage('Hata: Sepet oluşturulamadı.');
                    return;
                }
            }
            setCartId(existingCartId);
        };
        initializeCart();
    }, [createCart]);

    const GET_CART_ITEMS = gql`
    query GetCartItems($cartId: String!) {
      cart(cart_id: $cartId) {
        itemsV2 {
          items {
            id
            quantity
            product {
              sku
              name
              image {
                url
              }
              price_range {
                minimum_price {
                  final_price {
                    value
                    currency
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

    const { data: cartData, refetch: refetchCart } = useQuery(GET_CART_ITEMS, {
        variables: { cartId },
        skip: !cartId,
    });

    React.useEffect(() => {
        if (cartData?.cart?.itemsV2?.items) {
            setCartItems(cartData.cart.itemsV2.items);
        }
    }, [cartData]);

    const handleAddToCart = async () => {
        if (!cartId) {
            setMessage('Sepet hazır değil, lütfen bekleyin.');
            return;
        }
        setMessage('');
        try {
            await addToCart({
                variables: {
                    cartId,
                    sku,
                    quantity: 1,
                },
            });
            setMessage('Ürün sepete eklendi!');
            await refetchCart();
            setMinicartOpen(true);
        } catch (err) {
            setMessage(`Hata: ${err.message}`);
        }
    };

    const handleRemoveFromCart = async (itemId) => {
        try {
            await removeFromCart({ variables: { cartId, itemId: parseInt(itemId, 10) } });
            setMessage('Ürün sepetten çıkarıldı.');
            await refetchCart();
        } catch (err) {
            setMessage(`Hata: ${err.message}`);
        }
    };

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            await updateCartQuantity({
                variables: { cartId, itemId: parseInt(itemId, 10), quantity: newQuantity },
            });
            setMessage('Sepet güncellendi.');
            await refetchCart();
        } catch (err) {
            setMessage(`Hata: ${err.message}`);
        }
    };

    const handleWrapperClick = (e) => {
        if (minicartOpen && minicartRef.current && !minicartRef.current.contains(e.target)) {
            setMinicartOpen(false);
        }
    };

    if (loading) return <p>Yükleniyor...</p>;
    if (error) return <p>Hata: {error.message}</p>;
    if (!data?.products?.items.length) return <p>Ürün bulunamadı</p>;

    const product = data.products.items[0];

    return (
        <div onClickCapture={handleWrapperClick}>
            <div className="product-container" style={{ display: 'flex', gap: 20 }}>
                <img src={product.image.url} alt={product.image.label} width="300" />
                <div>
                    <h2>{product.name}</h2>
                    {product.brand && <p>Marka: {product.brand}</p>}
                    <p>
                        Fiyat: {product.price_range.minimum_price.final_price.value.toFixed(2)}{' '}
                        {product.price_range.minimum_price.final_price.currency}
                    </p>
                    <p>
                        Stok Durumu:{' '}
                        {product.stock_status === 'IN_STOCK' ? 'Stokta Var' : 'Tükendi'}
                    </p>
                    <button
                        onClick={handleAddToCart}
                        disabled={addingToCart || product.stock_status !== 'IN_STOCK'}
                    >
                        {addingToCart ? 'Ekleniyor...' : 'Sepete Ekle'}
                    </button>
                    {message && <p style={{ color: 'green' }}>{message}</p>}
                </div>
            </div>

            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999 }}>
                <button
                    onClick={() => setMinicartOpen(!minicartOpen)}
                    style={{
                        fontSize: 24,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        margin: '50px',
                    }}
                >
                    🛒
                    {cartItems.length > 0 && (
                        <span
                            style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                background: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '2px 6px',
                                fontSize: 12,
                            }}
                        >
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
                    )}
                </button>

                {minicartOpen && (
                    <div
                        ref={minicartRef}
                        style={{
                            position: 'absolute',
                            top: '40px',
                            right: 0,
                            width: 320,
                            maxHeight: 400,
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            borderRadius: 8,
                            padding: 16,
                        }}
                    >
                        <h4>Sepetiniz</h4>
                        {cartItems.length === 0 ? (
                            <p>Sepetiniz boş</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {cartItems.map((item) => (
                                    <li
                                        key={item.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: 12,
                                            borderBottom: '1px solid #eee',
                                            paddingBottom: 8,
                                        }}
                                    >
                                        <img
                                            src={item.product.image.url}
                                            alt={item.product.name}
                                            width={50}
                                            height={50}
                                            style={{ objectFit: 'cover', marginRight: 10, borderRadius: 4 }}
                                        />
                                        <div style={{ flexGrow: 1 }}>
                                            <strong>{item.product.name}</strong>
                                            <div>
                                                {item.quantity} x{' '}
                                                {item.product.price_range.minimum_price.final_price.value.toFixed(2)}{' '}
                                                {item.product.price_range.minimum_price.final_price.currency}
                                            </div>
                                            <div style={{ marginTop: 6 }}>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    style={{ marginRight: 5 }}
                                                >
                                                    -
                                                </button>
                                                <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFromCart(item.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'red',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                marginLeft: 8,
                                            }}
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductView;
