import { NextFunction, Request, Response } from 'express';

// Express 4 does not catch rejected promises thrown inside async route
// handlers - without this, an error anywhere in a controller becomes an
// unhandled promise rejection instead of reaching errorHandler, which hangs
// the request and can crash the whole process. Wrap every async handler
// with this so errors always flow to `next(err)` -> errorHandler.
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Req, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
