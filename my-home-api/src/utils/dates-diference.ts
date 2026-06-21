const dateDiference = (
  firstDate: Date,
  secondDate: Date,
  inDays: boolean = true
) => {
  const diference = Math.abs(secondDate.getTime() - firstDate.getTime());
  if (inDays) {
    return Math.ceil(diference / (1000 * 3600 * 24));
  } else {
    return diference;
  }
};

export default dateDiference;
