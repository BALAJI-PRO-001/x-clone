import { body, param, validationResult, Result } from 'express-validator';
import { FormattedDataValidationError, ValidationResult } from '../../lib/types';
import { Request, Response, NextFunction } from 'express';
import { createHTTPError } from '../../lib/utils/common';
import { StatusCodes as STATUS_CODES } from 'http-status-codes';
import { BAD_REQUEST_ERROR_MESSAGES } from '../../constants/httpErrorMessages';



export async function checkRequiredFiled(
  req: Request, 
  fieldName: string
): Promise<void> {

  await body(fieldName)
    .exists({ values: 'falsy' })
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required.`)
    .run(req);
}



export function extractFormattedValidationError(
  validationResult: Result
): FormattedDataValidationError {

  const errorMessages: Result<string> = validationResult.formatWith((err) => err.msg as string);
  const error = validationResult.array({ onlyFirstError: true })[0];
  return {
    isValid: false,
    validationLocation: error.location,
    providedValue: error.value,
    errorMessages: errorMessages.array(),
  };
}




export function validationResultHandler(
  res: Response,
  statusCode: number,
  validationResults: { [key: string]: any }
): void {

  res.status(statusCode).json({
    success: false,
    statusCode: statusCode,
    validationResults: validationResults
  });
}



export async function validateURL(
  req: Request,
  filedName: string
): Promise<FormattedDataValidationError | ValidationResult> {
  await body(filedName)
    .trim()
    .isURL()
    .withMessage(`Invalid ${filedName}.`)
    .run(req);

  const result = validationResult(req);
  if (!result.isEmpty()) {
    return extractFormattedValidationError(result);
  }

  return { isValid: true, value: req.body.profileImgURL };
}



export async function validateId(
  fields: string | string[],
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  await param('id')
    .optional()
    .isMongoId()
    .run(req);

  let result = validationResult(req);
  if (!result.isEmpty()) {
    return next(createHTTPError(
      STATUS_CODES.BAD_REQUEST,
      BAD_REQUEST_ERROR_MESSAGES.INVALID_MONGODB_ID
    ));
  }

  await body(fields)
    .optional()
    .isMongoId()
    .run(req);

  result = validationResult(req);
  if (!result.isEmpty()) {
    return next(createHTTPError(
      STATUS_CODES.BAD_REQUEST,
      BAD_REQUEST_ERROR_MESSAGES.INVALID_MONGODB_ID
    ));
  }

  next();
}
