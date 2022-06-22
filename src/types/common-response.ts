export class CommonResponse<T> {
  readonly result: T[];
  readonly total: number;

  constructor(result: T[], total: number) {
    this.result = result;
    this.total = total;
  }
}
