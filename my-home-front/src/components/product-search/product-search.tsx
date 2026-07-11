import { ProductSearchResult } from "../../models/products.model";
import { formatPrice } from "../formatters";
import { Loading } from "..";
import styles from "./product-search.module.css";

interface IProductSearch {
  results: ProductSearchResult[];
  searched: boolean;
  searching: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string;
  addingIndex: number | null;
  addLabel: string;
  onAdd: (result: ProductSearchResult, index: number) => void;
  onShowMore: () => void;
}

export default function ProductSearch({
  results,
  searched,
  searching,
  loadingMore,
  hasMore,
  error,
  addingIndex,
  addLabel,
  onAdd,
  onShowMore,
}: IProductSearch) {
  if (searching) {
    return (
      <div className={styles.status}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!searched) return null;

  if (results.length === 0) {
    return (
      <p className={styles.status}>
        No results found. Try a different name or brand.
      </p>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        {results.map((result, index) => (
          <div className={styles.card} key={index}>
            {result.image ? (
              <img
                className={styles.image}
                src={result.image}
                alt={result.name}
              />
            ) : (
              <div className={styles.noImage}>No image</div>
            )}
            <span className={styles.name} title={result.name}>
              {result.name}
            </span>
            <span className={styles.price}>{formatPrice(result.price)}</span>
            <button
              type="button"
              className={styles.addButton}
              disabled={addingIndex !== null}
              onClick={() => onAdd(result, index)}
            >
              {addingIndex === index ? "Adding..." : addLabel}
            </button>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          className={styles.showMore}
          disabled={loadingMore}
          onClick={onShowMore}
        >
          {loadingMore ? "Loading..." : "Show more"}
        </button>
      )}
    </div>
  );
}
