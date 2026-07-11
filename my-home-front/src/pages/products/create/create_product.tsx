import { useState, useContext, useEffect } from "react";
import { AppContext } from "../../../context";
import {
  createProduct,
  updateProduct,
  searchWebProducts,
  getBuyer,
  updateCart,
} from "../../../app.service";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./create_product.module.css";
import IProducts, { ProductSearchResult } from "../../../models/products.model";
import { Dropdown, Loading } from "../../../components";
import ProductSearch from "../../../components/product-search/product-search";
import Alert from "../../../components/alert/alert";

export default function CreateProduct() {
  const navigate = useNavigate();

  const { userId, defaultHome, homeLoading, setQtItemCart } =
    useContext(AppContext);
  const [unitKg, setUnitKg] = useState(false);
  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [searchError, setSearchError] = useState("");
  const [addError, setAddError] = useState("");
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [alertOn, setAlertOn] = useState(false);

  const { register, handleSubmit, setValue, reset, getValues } = useForm();
  const product: IProducts = useLocation().state;
  const update = product ? true : false;

  useEffect(() => {
    if (homeLoading) return;
    if (defaultHome === "") {
      navigate("/enter-home");
      return;
    }
    const defaultValues: any = {};
    defaultValues.name = product?.name;
    defaultValues.badge = product?.badge;
    defaultValues.price = product?.price;
    defaultValues.unit = product?.unit;
    defaultValues.size = product?.size;
    defaultValues.createdByUserId = product?.createdByUserId;
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultHome, homeLoading]);

  const goTo = (path: string) => {
    navigate(path);
  };
  const hSubmit = async (data: any) => {
    const prod: IProducts = data;

    try {
      setLoading(true);
      if (update) {
        await updateProduct(product._id, defaultHome, prod);
      } else {
        prod.createdByUserId = userId;
        prod.home = defaultHome;
        await createProduct(prod);
      }

      goTo("/products");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const hSelection = (item: any) => {
    if (item.value === "un") {
      setUnitKg(true);
    } else {
      setUnitKg(false);
    }
    setValue("unit", item.value);
  };

  const searchMessage = (error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 503) {
      return "Web search is not configured on the server yet.";
    }
    return "Search failed. Try again.";
  };

  const hSearch = async () => {
    const name = getValues("name");
    if (!name) {
      setSearched(false);
      setResults([]);
      setSearchError("Enter a product name to search.");
      return;
    }

    try {
      setSearching(true);
      setSearchError("");
      setAddError("");
      const data = await searchWebProducts(
        name,
        getValues("badge") || "",
        getValues("size") || "",
        1
      );
      setResults(data.results);
      setHasMore(data.hasMore);
      setPage(1);
      setSearched(true);
    } catch (error) {
      console.log(error);
      setSearched(false);
      setResults([]);
      setSearchError(searchMessage(error));
    } finally {
      setSearching(false);
    }
  };

  const hShowMore = async () => {
    try {
      setLoadingMore(true);
      const data = await searchWebProducts(
        getValues("name"),
        getValues("badge") || "",
        getValues("size") || "",
        page + 1
      );
      setResults([...results, ...data.results]);
      setHasMore(data.hasMore);
      setPage(page + 1);
    } catch (error) {
      console.log(error);
      setAddError("Could not load more results. Try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const hAdd = async (result: ProductSearchResult, index: number) => {
    const merged = {
      name: result.name,
      badge: getValues("badge") || result.badge || "",
      price: result.price,
      image: result.image,
      unit: getValues("unit") || result.unit || "un",
      size: getValues("size") || result.size || "",
    } as IProducts;

    try {
      setAddingIndex(index);
      setAddError("");
      if (update) {
        await updateProduct(product._id, defaultHome, merged);
        goTo("/products");
        return;
      }

      merged.createdByUserId = userId;
      merged.home = defaultHome;
      const created = await createProduct(merged);

      const buyer = await getBuyer(userId, defaultHome);
      if (buyer?.cart) {
        buyer.cart.items.push({ product: created, qt: 1 });
        const resp = await updateCart(buyer, defaultHome);
        setQtItemCart(resp.cart?.items?.length || 0);
      }
      setAlertOn(true);
    } catch (error) {
      console.log(error);
      setAddError(
        update
          ? "Could not update the product. Try again."
          : "Could not create the product. Try again."
      );
    } finally {
      setAddingIndex(null);
    }
  };

  return (
    <>
      {loading ? (
        <div className={styles.container}>
          <Loading />
        </div>
      ) : (
        <>
          <Alert alertOn={alertOn} setAlertOn={setAlertOn} />
          <form onSubmit={handleSubmit(hSubmit)}>
            <div className={styles.input}>
              <label>Name</label>
              <input {...register("name")} type="text" />
            </div>
            <div className={styles.input}>
              <label>Brand</label>
              <input
                {...register("badge")}
                placeholder="Ex: Coca-Cola, Nestlé, etc"
                type="text"
              />
            </div>
            <div className={styles.input}>
              <label>Price</label>
              <input {...register("price")} placeholder="Ex: 1,99" type="text" />
            </div>
            <div className={styles.input}>
              <Dropdown
                hSelection={hSelection}
                title="Unit of Measure"
                options={[
                  { label: "Kg", value: "kg" },
                  { label: "Unit", value: "un" },
                ]}
              />
            </div>
            {unitKg && (
              <div className={styles.input}>
                <label>Size</label>
                <input
                  {...register("size")}
                  placeholder="Ex: 100ml, 1L, 1kg, 400gr"
                  type="text"
                />
              </div>
            )}
            <div className={styles.input}>
              <button
                type="button"
                className={styles.searchButton}
                disabled={searching}
                onClick={hSearch}
              >
                {searching ? "Searching..." : "Search Web"}
              </button>
            </div>
            <div className={styles.buttons}>
              <button onClick={() => goTo("/products")}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
          {addError && <p className={styles.addError}>{addError}</p>}
          <ProductSearch
            results={results}
            searched={searched}
            searching={searching}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={searchError}
            addingIndex={addingIndex}
            addLabel={update ? "Update product" : "Add to cart"}
            onAdd={hAdd}
            onShowMore={hShowMore}
          />
        </>
      )}
    </>
  );
}
