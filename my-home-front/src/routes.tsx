import { useRoutes } from "react-router-dom";

import Products from "./pages/products/products";
import Cart from "./pages/cart/cart";
import Duties from "./pages/duties/duties";
import CreateProduct from "./pages/products/create/create_product";
import Home from "./pages/home/home";
import Menu from "./components/menu/menu";
import Onboarding from "./pages/onboarding/onboarding";

export interface RouteObject {
  caseSensitive?: boolean;
  children?: RouteObject[];
  element?: React.ReactNode;
  index?: boolean;
  path?: string;
}

const routes = [
  {
    path: "/welcome",
    element: <Onboarding />,
  },
  {
    path: "/",
    element: <Menu />,
    children: [
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },
      { path: "duties", element: <Duties /> },
      { path: "products", element: <Products /> },
      { path: "cart", element: <Cart /> },
      { path: "create-product", element: <CreateProduct /> },
    ],
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
