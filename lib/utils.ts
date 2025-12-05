export const getFormattedDate = (dateString: string): string | undefined => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
