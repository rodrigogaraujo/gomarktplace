import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity?: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productKeys = await AsyncStorage.getAllKeys();
      productKeys.forEach(async key => {
        const product = await AsyncStorage.getItem(key);
        if (product !== null) {
          products.find(
            item => item !== JSON.parse(product),
            () => {
              setProducts([...products, JSON.parse(product)]);
            },
          );
        }
      });
    }

    loadProducts();
  }, [products]);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const value = await AsyncStorage.getItem(
        `@GoMarketplace:product:${product.id}`,
      );
      if (value !== null) {
        const { id, image_url, title, price, quantity } = JSON.parse(value);
        const quantityNew = quantity + 1;
        await AsyncStorage.removeItem(`@GoMarketplace:product:${product.id}`);

        const productAdd = {
          id,
          image_url,
          title,
          price,
          quantity: quantityNew,
        };
        await AsyncStorage.setItem(
          `@GoMarketplace:product:${product.id}`,
          JSON.stringify(productAdd),
        );
        const newArr = products.filter(item => item.id !== id);
        setProducts([...newArr, productAdd]);
        return;
      }
      const { id, image_url, title, price } = product;
      const productNew: Product = {
        id,
        image_url,
        title,
        price,
        quantity: 1,
      };
      await AsyncStorage.setItem(
        `@GoMarketplace:product:${product.id}`,
        JSON.stringify(productNew),
      );

      setProducts([...products, productNew]);
    },
    [setProducts, products],
  );

  const increment = useCallback(
    async id => {
      const value = await AsyncStorage.getItem(`@GoMarketplace:product:${id}`);
      if (value !== null) {
        const { image_url, title, price, quantity } = JSON.parse(value);
        const quantityNew = quantity + 1;
        await AsyncStorage.removeItem(`@GoMarketplace:product:${id}`);

        const productAdd = {
          id,
          image_url,
          title,
          price,
          quantity: quantityNew,
        };
        await AsyncStorage.setItem(
          `@GoMarketplace:product:${id}`,
          JSON.stringify(productAdd),
        );
        const productChange = products.findIndex(
          item => item.id === productAdd.id,
        );
        const newArr = [...products];
        newArr[productChange] = productAdd;
        setProducts(newArr);
      }
    },
    [setProducts, products],
  );

  const decrement = useCallback(
    async id => {
      const value = await AsyncStorage.getItem(`@GoMarketplace:product:${id}`);
      if (value !== null) {
        const { image_url, title, price, quantity } = JSON.parse(value);
        if (quantity > 1) {
          const quantityNew = quantity - 1;
          await AsyncStorage.removeItem(`@GoMarketplace:product:${id}`);

          const productAdd = {
            id,
            image_url,
            title,
            price,
            quantity: quantityNew,
          };
          await AsyncStorage.setItem(
            `@GoMarketplace:product:${id}`,
            JSON.stringify(productAdd),
          );
          const productChange = products.findIndex(
            item => item.id === productAdd.id,
          );
          const newArr = [...products];
          newArr[productChange] = productAdd;
          setProducts(newArr);
        } else {
          await AsyncStorage.removeItem(`@GoMarketplace:product:${id}`);
          setProducts(products.filter(item => item.id !== id));
        }
      }
    },
    [setProducts, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
