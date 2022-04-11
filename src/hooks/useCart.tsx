import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const storageProducts = [...cart];

      const existingProduct = storageProducts.find(
        (product) => product.id === productId
      );

      const productStock = await api.get<Stock>(`/stock/${productId}`);

      const amountStock = productStock.data.amount;
      const amountProduct = existingProduct ? existingProduct.amount : 0;
      const amount = amountProduct + 1;

      if (amount > amountStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (existingProduct) {
        existingProduct.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1,
        };
        storageProducts.push(newProduct);
      }

      setCart(storageProducts);
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(storageProducts)
      );
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const storageProducts = [...cart];

      const productIndex = storageProducts.findIndex(
        (product) => product.id === productId
      );

      if (productIndex >= 0) {
        storageProducts.splice(productIndex, 1);
        setCart(storageProducts);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(storageProducts)
        );
      } else {
        toast.error("Erro na remoção do produto");
        return;
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const storageProducts = [...cart];

      const productExist = storageProducts.find(
        (product) => product.id === productId
      );

      if (productExist) {
        const productStock = await api.get<Stock>(`/stock/${productId}`);

        const amountStock = productStock.data.amount;

        if (amountStock > amount) {
          const updateStorageProducts = storageProducts.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  amount: amount,
                }
              : product
          );
          setCart(updateStorageProducts);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify(updateStorageProducts)
          );
        } else {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
      } else {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
