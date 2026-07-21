import { Model } from 'mongoose';
import { Request, Response } from 'express';

class BaseController<T> {
  // usable inside this class and any class that extends it
  //holds whichever model one particular instance of this is working with
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(req: Request, res: Response) {
    const document = new this.model(req.body);
    const newDocument = await document.save();

    res.status(201).json({
      message: 'Document created successfully',
      data: newDocument,
    });
  }

  async list(req: Request, res: Response) {
    const list = await this.model.find();

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
      req.body,
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
