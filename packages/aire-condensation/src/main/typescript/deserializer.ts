import "reflect-metadata";
import {Class} from "@condensation/types";
import {TypeRegistration} from "@condensation/type-registry";
import {Condensation} from "@condensation/condensation";

export interface Deserializer<T> {
  read(object: any): T;
}

export class StringDeserializer implements Deserializer<string> {
  read(object: any): string {
    return object as string;
  }
}

export class BooleanDeserializer implements Deserializer<boolean> {
  read(object: any): boolean {
    return object as boolean;
  }
}

export class NumberDeserializer implements Deserializer<number> {
  read(object: any): number {
    return object as number;
  }
}

export class TypeRegistrationDeserializer<T> implements Deserializer<T> {
  constructor(
      readonly type: Class<T>,
      readonly registration: TypeRegistration<T>
  ) {
  }

  read(value: any): T {
    if(Array.isArray(value)) {
      const values = value as any[],
          result = [];
      for(const v of values) {
        const read = new this.type();
        result.push(this.bind(read, v));
      }
      return result as any as T;
    } else {
      // const result = this.type.call(null);
      const result = new this.type();
      return this.bind(result, value);
    }
  }

  private bind(result: T, value: any): T {
    const reg = this.registration,
        props = reg.properties;
    if (props) {
      for (let [key, v] of props) {
        const readAlias = v.readAlias,
            deserializer = Condensation.deserializerFor(v.type),
            subobject = (value as any)[readAlias],
            propertyValue = deserializer.read(subobject);
        Reflect.set(result as any, v.realName, propertyValue, result);
      }
    }
    return result;
  }
}
