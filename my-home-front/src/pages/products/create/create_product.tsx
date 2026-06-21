import { useState, useContext, useEffect } from "react";
import { AppContext } from "../../../context";
import { createProduct, updateProduct } from "../../../app.service";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./create_product.module.css";
import IProducts from "../../../models/products.model";
import { Dropdown, Loading } from "../../../components";

export default function CreateProduct() {
  const navigate = useNavigate();

  const { userId } = useContext(AppContext);
  const [unitKg, setUnitKg] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, reset } = useForm();
  const product: IProducts = useLocation().state;
  const update = product ? true : false;

  useEffect(() => {
    let defaultValues: any = {};
    defaultValues.name = product?.name;
    defaultValues.badge = product?.badge;
    defaultValues.price = product?.price;
    defaultValues.unit = product?.unit;
    defaultValues.size = product?.size;
    defaultValues.createdByUserId = product?.createdByUserId;
    reset(defaultValues);
  }, []);

  const goTo = (path: string) => {
    navigate(path);
  };
  const hSubmit = async (data: any) => {
    const prod: IProducts = data;

    try {
      setLoading(true);
      if (update) {
        await updateProduct(product._id, prod);
      } else {
        prod.createdByUserId = userId;
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

  return (
    <>
      {loading ? (
        <div className={styles.container}>
          <Loading />
        </div>
      ) : (
        <form onSubmit={handleSubmit(hSubmit)}>
          <div className={styles.input}>
            <label>Name</label>
            <input {...register("name")} type="text" />
          </div>
          <div className={styles.input}>
            <label>Marca</label>
            <input
              {...register("badge")}
              placeholder="Ex: Coca-Cola, Nestlé, etc"
              type="text"
            />
          </div>
          <div className={styles.input}>
            <label>Preço</label>
            <input {...register("price")} placeholder="Ex: 1,99" type="text" />
          </div>
          <div className={styles.input}>
            <Dropdown
              hSelection={hSelection}
              title="Unidade de Medida"
              options={[
                { label: "Kg", value: "kg" },
                { label: "Unidade", value: "un" },
              ]}
            />
          </div>
          {unitKg && (
            <div className={styles.input}>
              <label>Tamanho</label>
              <input
                {...register("size")}
                placeholder="Ex: 100ml, 1L, 1kg, 400gr"
                type="text"
              />
            </div>
          )}
          <div className={styles.buttons}>
            <button onClick={() => goTo("/products")}>Cancelar</button>
            <button type="submit">Salvar</button>
          </div>
        </form>
      )}
    </>
  );
}
