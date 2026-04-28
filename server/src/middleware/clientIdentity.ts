import type { NextFunction, Request, Response } from "express";

export type ClientIdentityRequest = Request & {
  clientId: string;
};

export function requireClientIdentity(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const clientIdHeader = req.header("x-liftlogic-client-id");
  const clientId = Array.isArray(clientIdHeader)
    ? clientIdHeader[0]
    : clientIdHeader;

  if (!clientId) {
    res.status(400).json({
      code: "MISSING_CLIENT_ID",
      error: "Missing x-liftlogic-client-id header.",
    });
    return;
  }

  (req as ClientIdentityRequest).clientId = clientId;
  next();
}
