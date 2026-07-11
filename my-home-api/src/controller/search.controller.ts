import { Request, Response } from "express";
import { response } from "../types/response-body.type";
import { searchProducts as searchProductsRepo } from "../repository/search.repo";

const searchProducts = async (req: Request, res: Response) => {
  const { q, brand, size, page, limit } = req.query;

  try {
    if (!q)
      return response(res, 400, { message: "q is required", data: null });

    const apiKey = process.env.SEARCH_API_KEY;
    if (!apiKey)
      return response(res, 503, {
        message: "Search is not configured (missing SEARCH_API_KEY)",
        data: null,
      });

    const pageNumber = Math.max(parseInt(page as string) || 1, 1);
    const limitNumber = Math.min(
      Math.max(parseInt(limit as string) || 10, 1),
      50
    );

    const data = await searchProductsRepo(
      q as string,
      (brand as string) || "",
      (size as string) || "",
      pageNumber,
      limitNumber,
      apiKey
    );

    return response(res, 200, { message: "Search results", data });
  } catch (error) {
    console.log(error);
    return response(res, 500, { message: "Error", data: error });
  }
};

export { searchProducts };
