// import { Request, Response} from 'express'

// import BaseController from "./base.controller";
// import appRegistry from '../app.registry';

// class AdminController  {
//   registry: typeof appRegistry;

//   constructor() {
//     this.registry = appRegistry;
//   }

//   formatForAdmin(doc: any): object | object[] | null{
//     if (!doc) return null;
//     // Handle arrays of documents
//     if (Array.isArray(doc)) return doc.map(this.formatForAdmin);

//     // Handle single Mongoose or MongoDB document
//     const obj = doc.toObject ? doc.toObject() : { ...doc };
//     obj.id = obj._id;
//     delete obj._id;
//     delete obj.__v; // Optional: clean up Mongoose version key

//     return obj;
//   };

//   list(req: Request, res: Response) {
//     // v1/admin/:modelName
//     const modelName = req.params.modelName; // users
//     // userModel
//     const model = this.registry.get(modelName?.slice(0, modelName.length - 1))
//   }
// }

// const adminController = new AdminController();
