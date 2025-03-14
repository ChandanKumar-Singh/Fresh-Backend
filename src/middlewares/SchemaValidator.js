import Joi from "joi";
import ResponseCodes from "../config/ResponseCodes.js";
import ApiError from "./ApiError.js";
import httpStatus from "http-status";
import { logg } from "../utils/logger.js";
import resConv from "../utils/resConv.js";



const SchemaValidator = (schema) => async (req, res, next) => {
  try {
    const reqs = {
      ...req.body,
      ...req.query,
      ...req.params,
    };
    console.log("🔍 Request Data:", reqs);
    let validSchema = {};
    if (schema.body) validSchema = { ...validSchema, ...schema.body };
    if (schema.query) validSchema = { ...validSchema, ...schema.query };
    if (schema.params) validSchema = { ...validSchema, ...schema.params };
    const { value, error } = Joi.object(validSchema)
      .prefs({ errors: { label: "key" }, abortEarly: false })
      .validate(reqs);

    if (error) {
      let errors = {};
      const errorMessage = error.details
        .map((detail) => {
          const field = detail.path.join(".");
          const message = detail.message.replace(/\"/g, "");
          errors[field] = message;
          return `The "${field}" field ${message}`;
        })
        .join("; ");
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        ResponseCodes.ERROR.VALIDATION_FAILED,
        true,
        null,
        0,
        errors
      );
      return res
        .status(httpStatus.BAD_REQUEST)
        .send(resConv(errors, ResponseCodes.ERROR.VALIDATION_FAILED, 0, new Error().stack));
    }

    Object.assign(req, value);
    req.body = {
      ...req.body,
      ...req.params,
      ...req.query,
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

export default SchemaValidator;