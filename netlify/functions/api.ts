import serverless from "serverless-http";
import { createServer } from "../../server";

let cachedHandler: any;

const getHandler = async () => {
  if (!cachedHandler) {
    const app = await createServer();
    cachedHandler = serverless(app);
  }
  return cachedHandler;
};

export const handler = async (event: any, context: any) => {
  const h = await getHandler();
  return h(event, context);
};
