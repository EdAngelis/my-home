import { useRoutes } from "react-router-dom";

import Products from "./pages/products/products";
import Cart from "./pages/cart/cart";
import Duties from "./pages/duties/duties";
import CreateDuty from "./pages/duties/create/create_duty";
import Categories from "./pages/categories/categories";
import Makers from "./pages/makers/makers";
import CreateProduct from "./pages/products/create/create_product";
import Home from "./pages/home/home";
import Menu from "./components/menu/menu";
import Onboarding from "./pages/onboarding/onboarding";
import EnterHome from "./pages/enter-home/enter-home";
import CreateHome from "./pages/create-home/create_home";

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
      { path: "enter-home", element: <EnterHome /> },
      { path: "create-home", element: <CreateHome /> },
      { path: "duties", element: <Duties /> },
      { path: "create-duty", element: <CreateDuty /> },
      { path: "categories", element: <Categories /> },
      { path: "makers", element: <Makers /> },
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
