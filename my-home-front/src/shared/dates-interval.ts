const dateDifference = (firstDate: Date, secondDate: Date, inDays = true) => {
  const difference = Math.abs(secondDate.getTime() - firstDate.getTime());
  if (inDays) {
    return Math.ceil(difference / (1000 * 3600 * 24));
  } else {
    return difference;
  }
};

export default dateDifference;
