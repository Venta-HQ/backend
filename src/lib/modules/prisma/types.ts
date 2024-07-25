export type ClassLike = new (...args: any) => any;
export type GetConstructorArgs<T> = T extends new (...args: infer U) => any
  ? U
  : never;
export interface ConnectionObject<T> {
  [name: string]: T;
}

export type Initializer<T extends ClassLike> = (
  client: InstanceType<T>,
  tenant: string,
) => InstanceType<T>;

type ClientConfig<T extends ClassLike> = {
  class: T;
  initializer: Initializer<T>;
};

export type BasePluginConfig<T extends ClassLike> = {
  name: string;
  client: T | ClientConfig<T>;
};
