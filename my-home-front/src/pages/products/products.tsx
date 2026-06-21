import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context";
import { useNavigate } from "react-router-dom";
import TrashIcon from "../../components/svg/trash-icon";
import CartIcon from "../../components/svg/cart-icon";
import IProducts from "../../models/products.model";
import {
  getProducts,
  getBuyer,
  updateCart,
  deleteProduct,
} from "../../app.service";
import IBuyer from "../../models/buyer.model";
import styles from "./products.module.css";
import { formatPrice } from "../../components/formatters";
import Alert from "../../components/alert/alert";
import CheckBox from "../../components/check-box/check-box";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<IProducts[]>([]);
  const [buyer, setBuyer] = useState<IBuyer>();
  const [alertOn, setAlertOn] = useState<boolean>(false);
  const [userProductsOnly, setUserProductsOnly] = useState<boolean>(false);
  const [filteredProducts, setFilteredProducts] = useState<IProducts[]>([]);

  const { userId, setQtItemCart } = useContext(AppContext);

  useEffect(() => {
    loadProducts();
    userId !== "" ? loadBuyer() : goTo("/", null);
  }, []);

  const loadProducts = async () => {
    const response = await getProducts();
    setProducts(response);
    setFilteredProducts(response);
  };

  const loadBuyer = async () => {
    const response = await getBuyer(userId);
    const qtItems = response?.cart?.items?.length || 0;
    setQtItemCart(qtItems);
    await setBuyer(response);
  };

  const addItemToCart = async (product: IProducts) => {
    setAlertOn(true);

    if (buyer?.cart) {
      const hasProductInTheCart = buyer.cart.items.find((item) => {
        return item.product._id === product._id;
      });

      if (hasProductInTheCart) return;

      buyer.cart.items.push({ product, qt: 1 });

      try {
        const resp = await updateCart(buyer);
        const qtItems = resp.cart?.items?.length || 0;
        setQtItemCart(qtItems);
        await setBuyer(resp);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const deleteProd = async (id: string) => {
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (error) {
      console.log(error);
    }
  };

  const handleFilter = (event: any) => {
    const value = event.target.value;
    const temp = products.filter((product) =>
      product.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProducts(temp);
  };

  const goTo = (path: string, params: any) => {
    navigate(path, { state: params });
  };

  return (
    <>
      <Alert alertOn={alertOn} setAlertOn={setAlertOn} />
      <div className={styles.container}>
        <div className={styles.top}>
          <button onClick={() => goTo("/create-product", null)}>
            NOVO PRODUTO
          </button>
        </div>

        <div className={styles.filter}>
          <input
            placeholder="FILTRAR PRODUTOS"
            type="text"
            onChange={(event) => handleFilter(event)}
          />
        </div>
        <CheckBox
          label="Apenas meus produtos"
          checked={true}
          onChange={(checked) => setUserProductsOnly(checked)}
        />
        {filteredProducts.map((product, index) => {
          return userProductsOnly ? (
            product.createdByUserId === userId && (
              <div className={styles.row} key={index}>
                <div className={styles.trashIconDiv}>
                  <div onClick={() => deleteProd(product._id)}>
                    {product.createdByUserId === userId && (
                      <TrashIcon color1="#00641C" color2="#D1FFCD" />
                    )}
                  </div>
                </div>
                <div
                  onClick={() => goTo("/create-product", product)}
                  className={styles.cardProduct}
                >
                  <span className={styles.product}>{product.name}</span>
                  <span className={styles.badge}>{product.badge}</span>
                  <span className={styles.price}>
                    {formatPrice(product.price)}
                  </span>
                </div>
                <div onClick={() => addItemToCart(product)}>
                  <CartIcon color1="#FF9A62" color2="#D1FFCD" />
                </div>
              </div>
            )
          ) : (
            <div className={styles.row} key={index}>
              <div className={styles.trashIconDiv}>
                <div onClick={() => deleteProd(product._id)}>
                  {product.createdByUserId !== userId && (
                    <TrashIcon color1="#00641C" color2="#D1FFCD" />
                  )}
                </div>
              </div>
              <div
                onClick={() => goTo("/create-product", product)}
                className={styles.cardProduct}
              >
                <span className={styles.product}>{product.name}</span>
                <span className={styles.badge}>{product.badge}</span>
                <span className={styles.price}>
                  {formatPrice(product.price)}
                </span>
              </div>
              <div onClick={() => addItemToCart(product)}>
                <CartIcon color1="#FF9A62" color2="#D1FFCD" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
