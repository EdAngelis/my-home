type ExecutionHistory = {
  date: Date;
  executor?: string;
};
type DutiesType = {
  cod: string;
  name: string;
  value: number;
  description: string;
  frequencyDays: number;
  executionHistory?: ExecutionHistory[];
};

export default DutiesType;
