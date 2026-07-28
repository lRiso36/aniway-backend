import { Request, Response } from 'express';
import { Model } from 'mongoose';
import _ from 'lodash';

import logger from '../logs/logger';

class BaseController<T> {
  // usable inside this class and any class that extends it
  //holds whichever model one particular instance of this is working with
  protected model: Model<T>;
  _: typeof _;
  logger: typeof logger;

  constructor(model: Model<T>) {
    this.model = model;
    this._ = _;
    this.logger = logger;
  }

  async create(req: Request, res: Response) {
    try {
      logger.info('base.controller.ts: create: req.body =', req.body);

      const document = new this.model(req.body);

      const newDocument = await document.save();

      if (!newDocument) {
        throw new Error('Failed to create document');
      }

      res.status(201).json({
        message: 'Document created successfully',
        data: newDocument,
      });
    } catch (error: unknown) {
      logger.error('Error creating document:', error);
      res.status(500).json({
        message: error?.toString(),
      });
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
    const found = await this.model.findById(req.params.id);

    if (!found) {
      res.status(404).json({
        message: 'Document not found',
      });
    }

    res.status(200).json({
      message: 'Document found successfully',
      data: found,
    });
  }

  async update(req: Request, res: Response) {
    const updated = await this.model.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true, runValidators: true }
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
