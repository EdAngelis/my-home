import { useCallback, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import IBuyer from "../../models/buyer.model";
import IProducts from "../../models/products.model";
import { dim, plus } from "../../assets/icons/icons";
import { AppContext } from "../../context";
import styles from "./cart.module.css";

import { getBuyer, updateCart, sendWhatsapp } from "../../app.service";
import InputButton from "../../components/input-button/input-button";
import Alert from "../../components/alert/alert";

export default function Cart() {
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<IBuyer>();
  const [total, setTotal] = useState<string>("0.00");
  const [alertOn, setAlertOn] = useState<boolean>(false);
  const [phoneEditing, setPhoneEditing] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>("");

  const { userId, defaultHome, homeLoading, setQtItemCart } =
    useContext(AppContext);

  useEffect(() => {
    if (userId === "") {
      navigate("/");
      return;
    }
    if (homeLoading) return;
    if (defaultHome === "") {
      navigate("/enter-home");
      return;
    }
    loadBuyer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, defaultHome, homeLoading]);

  const loadBuyer = async () => {
    const response = await getBuyer(userId, defaultHome);
    await setBuyer(response);
  };

  const handleTotal = useCallback(() => {
    let total = 0;
    if (!buyer?.cart) return;
    for (const item of buyer.cart.items) {
      total = total + item.qt * item.product.price;
      setTotal(total.toFixed(2));
    }
  }, [buyer?.cart]);

  useEffect(() => {
    handleTotal();
  }, [buyer?.cart?.items, handleTotal]);

  const editQuantity = async (product: IProducts, qt: number) => {
    if (buyer?.cart) {
      buyer.cart.items = buyer.cart.items.filter((item) => {
        if (item.product.name === product.name) {
          if (item.product.unit === "kg") qt = qt / 10;
          item.qt = item.qt + qt;
        }
        return item.qt > 0;
      });
      await hUpdateBuyer(buyer);
    }
  };

  const hCleanCart = async () => {
    if (buyer?.cart) {
      buyer.cart.items = [];
      await hUpdateBuyer(buyer);
      setTotal("0.00");
    }
  };

  const hUpdateBuyer = async (buyer: IBuyer) => {
    if (!buyer) return;
    try {
      const resp = await updateCart(buyer!, defaultHome);
      const qtItems = resp.cart?.items?.length || 0;
      setQtItemCart(qtItems);
      setBuyer(resp);
    } catch (error) {
      console.log(error);
    }
  };

  const onPhoneChange = async (e: any) => {
    buyer!.marketPhone = e;
    await hUpdateBuyer(buyer!);
    setPhoneEditing(false);
    setAlertOn(true);
  };

  const goTo = (path: string, params: any) => {
    navigate(path, { state: params });
  };

  return (
    <>
      <Alert alertOn={alertOn} setAlertOn={setAlertOn} />
      <div className={styles.containerCart}>
        <div className={styles.topCart}>
          <span>Total: {total}</span>
          <InputButton
            type="number"
            label={phoneEditing ? "Save" : "Send List to Market"}
            value={phoneEditing ? "Save" : "Send Order"}
            onClick={() =>
              phoneEditing
                ? onPhoneChange(phoneInput)
                : buyer
                ? sendWhatsapp(buyer)
                : null
            }
            onInputChange={(v) => {
              setPhoneInput(v);
              setPhoneEditing(true);
            }}
            onKey={(e) => onPhoneChange(e)}
            placeholder={buyer?.marketPhone ? buyer.marketPhone : "Store Phone"}
          />
        </div>
        <div className={styles.containerTable}>
          {buyer?.cart?.items
            ? buyer.cart.items
                .slice()
                .sort((a, b) =>
                  a.product.name.localeCompare(b.product.name, "pt-BR", {
                    sensitivity: "base",
                  })
                )
                .map((item, index) => (
                <div className={styles.rowCart} key={index}>
                  <span
                    className={styles.productName}
                    onClick={() => goTo("/create-product", item.product)}
                  >
                    {item?.product?.name ?? "-"}
                  </span>
                  <div
                    onClick={() => editQuantity(item.product, -1)}
                    className={styles.img}
                  >
                    <img src={dim} alt="" />
                  </div>

                  <span>{item.qt.toFixed(1)}</span>
                  <div
                    onClick={() => editQuantity(item.product, 1)}
                    className={styles.img}
                  >
                    <img src={plus} alt="" />
                  </div>
                </div>
              ))
            : null}
        </div>
        <button
          className={`${styles.btnClean}`}
          onClick={() => {
            hCleanCart();
          }}
        >
          Clear
        </button>
      </div>
    </>
  );
}
