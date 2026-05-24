import { publicProcedure, router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { formRouter } from "./routes/form/route";
import { productRouter } from "./routes/product/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  form: formRouter,
  product: productRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
