import { Document } from 'mongoose';

import { defaultSchemaOptions } from './schema-config';

describe('Schema Config', () => {
  describe('defaultSchemaOptions', () => {
    it('should have timestamps enabled', () => {
      expect(defaultSchemaOptions.timestamps).toBe(true);
    });

    it('should have toJSON transform function', () => {
      expect(defaultSchemaOptions.toJSON).toBeDefined();
      expect(defaultSchemaOptions.toJSON.transform).toBeDefined();
      expect(typeof defaultSchemaOptions.toJSON.transform).toBe('function');
    });

    it('should have toObject transform function', () => {
      expect(defaultSchemaOptions.toObject).toBeDefined();
      expect(defaultSchemaOptions.toObject.transform).toBeDefined();
      expect(typeof defaultSchemaOptions.toObject.transform).toBe('function');
    });
  });

  describe('Transform Functions', () => {
    const mockDoc = {} as Document;
    const mockObjectId = 'mockObjectId123';

    describe('toJSON transform', () => {
      it('should transform _id to id', () => {
        const ret = {
          _id: mockObjectId,
          __v: 0,
          name: 'Test',
          createdAt: new Date(),
        };

        const transformed = defaultSchemaOptions.toJSON.transform(mockDoc, ret);

        expect(transformed.id).toBe(mockObjectId);
        expect(transformed._id).toBeUndefined();
        expect(transformed.__v).toBeUndefined();
        expect(transformed.name).toBe('Test');
        expect(transformed.createdAt).toEqual(ret.createdAt);
      });

      it('should preserve all other properties', () => {
        const ret = {
          _id: mockObjectId,
          __v: 0,
          prop1: 'value1',
          prop2: 123,
          prop3: true,
          prop4: { nested: 'object' },
          prop5: ['array', 'values'],
          prop6: null,
          prop7: undefined,
        };

        const transformed = defaultSchemaOptions.toJSON.transform(mockDoc, ret);

        expect(transformed.prop1).toBe('value1');
        expect(transformed.prop2).toBe(123);
        expect(transformed.prop3).toBe(true);
        expect(transformed.prop4).toEqual({ nested: 'object' });
        expect(transformed.prop5).toEqual(['array', 'values']);
        expect(transformed.prop6).toBeNull();
        expect(transformed.prop7).toBeUndefined();
      });

      it('should handle empty object', () => {
        const ret = {
          _id: mockObjectId,
          __v: 0,
        };

        const transformed = defaultSchemaOptions.toJSON.transform(mockDoc, ret);

        expect(transformed.id).toBe(mockObjectId);
        expect(transformed._id).toBeUndefined();
        expect(transformed.__v).toBeUndefined();
        expect(Object.keys(transformed)).toEqual(['id']);
      });

      it('should handle missing _id', () => {
        const ret = {
          __v: 0,
          name: 'Test',
        };

        const transformed = defaultSchemaOptions.toJSON.transform(mockDoc, ret);

        expect(transformed.id).toBeUndefined();
        expect(transformed._id).toBeUndefined();
        expect(transformed.__v).toBeUndefined();
        expect(transformed.name).toBe('Test');
      });

      it('should handle missing __v', () => {
        const ret = {
          _id: mockObjectId,
          name: 'Test',
        };

        const transformed = defaultSchemaOptions.toJSON.transform(mockDoc, ret);

        expect(transformed.id).toBe(mockObjectId);
        expect(transformed._id).toBeUndefined();
        expect(transformed.__v).toBeUndefined();
        expect(transformed.name).toBe('Test');
      });
    });

    describe('toObject transform', () => {
      it('should transform _id to id', () => {
        const ret = {
          _id: mockObjectId,
          __v: 0,
          name: 'Test',
          createdAt: new Date(),
        };

        const transformed = defaultSchemaOptions.toObject.transform(
          mockDoc,
          ret
        );

        expect(transformed.id).toBe(mockObjectId);
        expect(transformed._id).toBeUndefined();
        expect(transformed.__v).toBeUndefined();
        expect(transformed.name).toBe('Test');
        expect(transformed.createdAt).toEqual(ret.createdAt);
      });

      it('should preserve all other properties', () => {
        const ret = {
          _id: mockObjectId,
          __v: 0,
          prop1: 'value1',
          prop2: 123,
          prop3: true,
          prop4: { nested: 'object' },
          prop5: ['array', 'values'],
          prop6: null,
          prop7: undefined,
        };

        const transformed = defaultSchemaOptions.toObject.transform(
          mockDoc,
          ret
        );

        expect(transformed.prop1).toBe('value1');
        expect(transformed.prop2).toBe(123);
        expect(transformed.prop3).toBe(true);
        expect(transformed.prop4).toEqual({ nested: 'object' });
        expect(transformed.prop5).toEqual(['array', 'values']);
        expect(transformed.prop6).toBeNull();
        expect(transformed.prop7).toBeUndefined();
      });

      it('should handle empty object', () => {
        const ret = {
          _id: mockObjectId,
          __v: 0,
        };

        const transformed = defaultSchemaOptions.toObject.transform(
          mockDoc,
          ret
        );

        expect(transformed.id).toBe(mockObjectId);
        expect(transformed._id).toBeUndefined();
        expect(transformed.__v).toBeUndefined();
        expect(Object.keys(transformed)).toEqual(['id']);
      });

      it('should handle missing _id', () => {
        const ret = {
          __v: 0,
          name: 'Test',
        };

        const transformed = defaultSchemaOptions.toObject.transform(
          mockDoc,
          ret
        );

        expect(transformed.id).toBeUndefined();
        expect(transformed._id).toBeUndefined();
        expect(transformed.__v).toBeUndefined();
        expect(transformed.name).toBe('Test');
      });

      it('should handle missing __v', () => {
        const ret = {
          _id: mockObjectId,
          name: 'Test',
        };

        const transformed = defaultSchemaOptions.toObject.transform(
          mockDoc,
          ret
        );

        expect(transformed.id).toBe(mockObjectId);
        expect(transformed._id).toBeUndefined();
        expect(transformed.__v).toBeUndefined();
        expect(transformed.name).toBe('Test');
      });
    });

    describe('Transform consistency', () => {
      it('should have identical behavior for toJSON and toObject transforms', () => {
        const testCases = [
          {
            _id: mockObjectId,
            __v: 0,
            name: 'Test',
            count: 42,
            active: true,
            tags: ['tag1', 'tag2'],
            metadata: { key: 'value' },
          },
          {
            _id: 'differentId',
            prop: 'value',
          },
          {
            __v: 2,
            data: 'test',
          },
          {},
        ];

        testCases.forEach((testCase) => {
          const jsonResult = defaultSchemaOptions.toJSON.transform(mockDoc, {
            ...testCase,
          });
          const objectResult = defaultSchemaOptions.toObject.transform(
            mockDoc,
            { ...testCase }
          );

          expect(jsonResult).toEqual(objectResult);
        });
      });
    });
  });

  describe('Type Safety', () => {
    it('should return TransformedObject type', () => {
      const ret = {
        _id: 'testId',
        __v: 0,
        name: 'Test',
      };

      const transformed = defaultSchemaOptions.toJSON.transform(
        {} as Document,
        ret
      );

      expect(transformed).toHaveProperty('id');
      expect(typeof transformed.id).toBe('string');
    });
  });
});
