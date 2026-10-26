import { Request, Response } from 'express';
import { Model } from 'mongoose';
import _ from 'lodash';

import errorHandler from '../utils/error-handler.util';
import ERROR_MESSAGES from '../constants/error-messages';
import logger from '../logs/logger';
import * as jwtUtil from '../utils/jwt.util';
import appBroker from '../app.broker';
import config from '../config/config';
import AppRegistry from '../app.registry';

class BaseController<T> {
  // usable inside this class and any class that extends it
  //holds whichever model one particular instance of this is working with
  protected model: Model<T>;
  _: typeof _;
  logger: typeof logger;
  ERROR_MESSAGES: typeof ERROR_MESSAGES;
  errorHandler: typeof errorHandler;
  jwtUtil: typeof jwtUtil;
  broker: typeof appBroker;
  listeners?(): void;
  config: typeof config;
  registry: typeof AppRegistry;

  constructor(model: Model<T>) {
    this.model = model;
    this._ = _;
    this.logger = logger;
    this.ERROR_MESSAGES = ERROR_MESSAGES;
    this.errorHandler = errorHandler;
    this.jwtUtil = jwtUtil;
    this.broker = appBroker;
    this.config = config;
    this.registry = AppRegistry;

    if (typeof this.listeners === 'function') this.listeners();
  }

  async create(req: Request, res: Response) {
    try {
      logger.info('base.controller.ts: create: req.body =', req.body);

      const document = new this.model(req.body);

      const newDocument = await document.save();

      if (!newDocument) throw new Error(ERROR_MESSAGES.SERVER_ERROR);

      // if (!newDocument) {
      //   throw new Error('Failed to create document');
      // }

      res.status(201).json({
        message: 'Document created successfully',
        data: newDocument,
      });
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  async list(req: Request, res: Response) {
    const { page = 1, pageSize = 10 } = req.query;

    const q = this._.omit(req.query, ['page', 'pageSize']);

    const list = await this.model
      .find(q)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    res.status(200).json({
      message: 'Documents found successfully',
      data: list,
    });
  }

  async getById(req: Request, res: Response) {
    try {
      const found = await this.model.findById(req.params.id);

      if (!found) throw new Error(ERROR_MESSAGES.NOT_FOUND);
      // if (!found) {
      //   res.status(404).json({
      //     message: 'Document not found',
      //   });
      // }

      res.status(200).json({
        message: 'Document found successfully',
        data: found,
      });
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  async update(req: Request, res: Response) {
    const find = await this.model.findById(req.params.id);

    if(!find) throw new Error("Document not found...");

    this.logger.info("req.body =", req.body)

    const updated = await this.model.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!updated) {
      return res.status(400).json({
        message: 'Document not found',
      });
    }

    res.status(200).json({
      message: 'Document updated successfully',
      data: updated,
    });
  }

  async delete(req: Request, res: Response) {
    const deleted = await this.model.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    res.status(200).json({
      message: 'Document deleted successfully',
      data: deleted,
    });
  }
}

export default BaseController;
