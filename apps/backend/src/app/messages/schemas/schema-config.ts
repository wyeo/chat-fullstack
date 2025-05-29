import { Document } from 'mongoose';

interface TransformableDocument extends Document {
  _id: any;
  __v?: number;
}

interface TransformedObject {
  id: string;
  [key: string]: any;
}

export const defaultSchemaOptions = {
  timestamps: true,
  toJSON: {
    transform: (_doc: TransformableDocument, ret: Record<string, any>): TransformedObject => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret as TransformedObject;
    },
  },
  toObject: {
    transform: (_doc: TransformableDocument, ret: Record<string, any>): TransformedObject => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret as TransformedObject;
    },
  },
};
