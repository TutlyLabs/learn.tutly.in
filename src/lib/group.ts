type Prefix<T, Prefix extends string, Sep extends string> = T extends string
  ? `${Prefix}${Sep}${T}`
  : never;

type PrefixKeys<T extends Record<string, any>, P extends string, Sep extends string> = {
  [K in keyof T as Prefix<K, P, Sep>]: T[K];
};

export function groupActions<
  Actions extends Record<string, any> = Record<string, any>,
  Name extends string = string,
  Sep extends string = "_",
>(name: Name, actions: Actions, sep: Sep = "_" as Sep): PrefixKeys<Actions, Name, Sep> {
  return Object.fromEntries(
    Object.entries(actions).map(([key, value]) => [`${name}${sep}${key}`, value])
  ) as PrefixKeys<Actions, Name, Sep>;
}
