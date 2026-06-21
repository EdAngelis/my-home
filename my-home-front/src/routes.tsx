import { useRoutes } from "react-router-dom";

import Products from "./pages/products/products";
import Cart from "./pages/cart/cart";
import Duties from "./pages/duties/duties";
import CreateProduct from "./pages/products/create/create_product";
import Home from "./pages/home/home";
import Menu from "./components/menu/menu";
export interface RouteObject {
  caseSensitive?: boolean;
  children?: RouteObject[];
  element?: React.ReactNode;
  index?: boolean;
  path?: string;
}
const routes = [
  {
    path: "/",
    index: true,
    element: (
      <>
        <Menu />
        <Home />
      </>
    ),
  },
  {
    path: "/home",
    element: (
      <>
        <Menu />
        <Home />
      </>
    ),
  },
  {
    path: "/products",
    element: (
      <>
        <Menu />
        <Products />
      </>
    ),
  },
  {
    path: "/cart",
    element: (
      <>
        <Menu />
        <Cart />
      </>
    ),
  },
  {
    path: "/duties",
    element: (
      <>
        <Menu />
        <Duties />
      </>
    ),
  },
  {
    path: "/create-product",
    element: (
      <>
        <Menu />
        <CreateProduct />
      </>
    ),
  },
  {
    path: "*",
    element: <h1>404</h1>,
  },
];

export default function Routes(): JSX.Element {
  const routing = useRoutes(routes);
  return <>{routing}</>;
}
