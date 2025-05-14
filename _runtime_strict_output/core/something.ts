// Something class definition
export class Something {
  private value: string;
  
  constructor(value: string = "default") {
    this.value = value;
  }
  
  getValue(): string {
    return this.value;
  }
}