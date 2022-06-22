export class QueryOption<T> {
  /**Number item should be display at a page */
  readonly pageSize: number = 10;

  /**CurrentPage is the current position of user on the page */
  readonly currentPage: number = 1;

  /**extend search property */
  readonly meta: T;

  /**Sort should be the feild of a table like Name,Price, ... */
  readonly sort?: string;

  /**Sort direction should be Asc | Desc */
  readonly sortDirection?: string;

  constructor(meta: T, currentPage: number) {
    this.meta = meta;
    this.currentPage = currentPage;
  }
}
