import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context";
import { useNavigate } from "react-router-dom";
import TrashIcon from "../../components/svg/trash-icon";
import CartIcon from "../../components/svg/cart-icon";
import SearchIcon from "../../components/svg/search-icon";
import CloseIcon from "../../components/svg/close-icon";
import IProducts from "../../models/products.model";
import { ProductSearchResult } from "../../models/products.model";
import {
  getProducts,
  getBuyer,
  updateCart,
  deleteProduct,
  createProduct,
  searchWebProducts,
} from "../../app.service";
import IBuyer from "../../models/buyer.model";
import styles from "./products.module.css";
import { formatPrice } from "../../components/formatters";
import Alert from "../../components/alert/alert";
import ProductSearch from "../../components/product-search/product-search";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<IProducts[]>([]);
  const [buyer, setBuyer] = useState<IBuyer>();
  const [alertOn, setAlertOn] = useState<boolean>(false);
  const [filteredProducts, setFilteredProducts] = useState<IProducts[]>([]);
  const [filterText, setFilterText] = useState("");

  const [webOpen, setWebOpen] = useState(false);
  const [webResults, setWebResults] = useState<ProductSearchResult[]>([]);
  const [webSearched, setWebSearched] = useState(false);
  const [webSearching, setWebSearching] = useState(false);
  const [webLoadingMore, setWebLoadingMore] = useState(false);
  const [webHasMore, setWebHasMore] = useState(false);
  const [webPage, setWebPage] = useState(1);
  const [webSearchError, setWebSearchError] = useState("");
  const [webAddError, setWebAddError] = useState("");
  const [webAddingIndex, setWebAddingIndex] = useState<number | null>(null);

  const { userId, defaultHome, homeLoading, setQtItemCart } =
    useContext(AppContext);

  useEffect(() => {
    if (userId === "") {
      goTo("/", null);
      return;
    }
    if (homeLoading) return;
    if (defaultHome === "") {
      navigate("/enter-home");
    }
  }, [userId, defaultHome, homeLoading]);

  useEffect(() => {
    if (userId !== "" && defaultHome !== "") {
      loadBuyer();
      loadProducts();
    }
  }, [userId, defaultHome]);

  const loadProducts = async () => {
    const response = await getProducts(userId, defaultHome);
    setProducts(response);
    setFilteredProducts(response);
  };

  const loadBuyer = async () => {
    const response = await getBuyer(userId, defaultHome);
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
        const resp = await updateCart(buyer, defaultHome);
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
      await deleteProduct(id, defaultHome);
      loadProducts();
    } catch (error) {
      console.log(error);
    }
  };

  const isInCart = (product: IProducts) =>
    buyer?.cart?.items?.some((item) => item.product._id === product._id) ??
    false;

  const handleFilter = (event: any) => {
    const value = event.target.value;
    setFilterText(value);
    const temp = products.filter((product) =>
      product.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProducts(temp);
  };

  const goTo = (path: string, params: any) => {
    navigate(path, { state: params });
  };

  const searchMessage = (error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 503) {
      return "Web search is not configured on the server yet.";
    }
    return "Search failed. Try again.";
  };

  const hSearchWeb = async () => {
    setWebOpen(true);
    if (!filterText) {
      setWebSearched(false);
      setWebResults([]);
      setWebSearchError("Enter a product name to search.");
      return;
    }

    try {
      setWebSearching(true);
      setWebSearchError("");
      setWebAddError("");
      const data = await searchWebProducts(filterText, "", "", 1);
      setWebResults(data.results);
      setWebHasMore(data.hasMore);
      setWebPage(1);
      setWebSearched(true);
    } catch (error) {
      console.log(error);
      setWebSearched(false);
      setWebResults([]);
      setWebSearchError(searchMessage(error));
    } finally {
      setWebSearching(false);
    }
  };

  const hCloseWeb = () => {
    setWebOpen(false);
    setWebResults([]);
    setWebSearched(false);
    setWebSearchError("");
    setWebAddError("");
  };

  const hShowMoreWeb = async () => {
    try {
      setWebLoadingMore(true);
      const data = await searchWebProducts(filterText, "", "", webPage + 1);
      setWebResults([...webResults, ...data.results]);
      setWebHasMore(data.hasMore);
      setWebPage(webPage + 1);
    } catch (error) {
      console.log(error);
      setWebAddError("Could not load more results. Try again.");
    } finally {
      setWebLoadingMore(false);
    }
  };

  const hAddWeb = async (result: ProductSearchResult, index: number) => {
    const merged = {
      name: result.name,
      badge: result.badge || "",
      price: result.price,
      image: result.image,
      unit: result.unit || "un",
      size: result.size || "",
      createdByUserId: userId,
      home: defaultHome,
    } as IProducts;

    try {
      setWebAddingIndex(index);
      setWebAddError("");
      const created = await createProduct(merged);

      const resp = await getBuyer(userId, defaultHome);
      if (resp?.cart) {
        resp.cart.items.push({ product: created, qt: 1 });
        const updated = await updateCart(resp, defaultHome);
        setQtItemCart(updated.cart?.items?.length || 0);
        setBuyer(updated);
      }
      setAlertOn(true);
      loadProducts();
    } catch (error) {
      console.log(error);
      setWebAddError("Could not create the product. Try again.");
    } finally {
      setWebAddingIndex(null);
    }
  };

  return (
    <>
      <Alert alertOn={alertOn} setAlertOn={setAlertOn} />
      <div className={styles.container}>
        <div className={styles.top}>
          <button onClick={() => goTo("/create-product", null)}>
            NEW PRODUCT
          </button>
        </div>

        <div className={styles.filter}>
          <input
            placeholder="FILTER PRODUCTS"
            type="text"
            value={filterText}
            onChange={(event) => handleFilter(event)}
          />
          <button
            type="button"
            className={styles.iconButton}
            aria-label={webOpen ? "Close web search" : "Search web"}
            onClick={webOpen ? hCloseWeb : hSearchWeb}
          >
            {webOpen ? (
              <CloseIcon color1="#FF9A62" />
            ) : (
              <SearchIcon color1="#FF9A62" />
            )}
          </button>
        </div>
        {webOpen ? (
          <>
            {webAddError && <p className={styles.addError}>{webAddError}</p>}
            <ProductSearch
              results={webResults}
              searched={webSearched}
              searching={webSearching}
              loadingMore={webLoadingMore}
              hasMore={webHasMore}
              error={webSearchError}
              addingIndex={webAddingIndex}
              addLabel="Add to cart"
              onAdd={hAddWeb}
              onShowMore={hShowMoreWeb}
            />
          </>
        ) : (
          filteredProducts
            .filter((product) => !isInCart(product))
            .map((product, index) => (
              <div className={styles.row} key={index}>
                <div className={styles.trashIconDiv}>
                  <div onClick={() => deleteProd(product._id)}>
                    <TrashIcon color1="#00641C" color2="#D1FFCD" />
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
            ))
        )}
      </div>
    </>
  );
}
