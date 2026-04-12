export type ListPage<TItem> = {
  data: TItem[];
  nextToken?: string | null;
  errors?: { message: string }[] | null;
};

export type GetResult<TItem> = {
  data?: TItem | null;
  errors?: { message: string }[] | null;
};

export type MutationResult<TItem> = {
  data: TItem;
  errors?: { message: string }[] | null;
};

export type AmplifyModelFacade<TItem, TKey, TCreate> = {
  get(key: TKey): Promise<GetResult<TItem>>;
  list(args: {
    filter: Record<string, unknown>;
    limit?: number;
    nextToken?: string | null;
  }): Promise<ListPage<TItem>>;
  create(input: TCreate): Promise<MutationResult<TItem>>;
};
