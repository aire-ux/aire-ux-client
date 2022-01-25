import {Class} from "@condensation/types";
import {Condensation} from "@condensation/condensation";

export function Remotable<T>(type: Class<T>): void {
  Condensation.remoteRegistry.register(type);
  // return type;
}


const ctx = Condensation.defaultContext();

export function Receive<T>(type: Class<T>) {
  return <U>(target: Class<U>, key: PropertyKey, index: number) => {
    if (!key) {
      Condensation.remoteRegistry.defineParameter(target, {
        type: type,
        index: index,
        invocationType: "constructor",
        invocationTarget: "constructor",
      });
    } else {
      Condensation.remoteRegistry.defineParameter((target as any).constructor, {
        type: type,
        index: index,
        invocationTarget: key,
        invocationType: "method",
      });
    }
  };
}


export function Remote(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    const formals = ctx.formalParams(target.constructor, 'method', ...args);
    return original.apply(this, formals);
    // return original.bind(target).apply(target, ...formals);
  }
}