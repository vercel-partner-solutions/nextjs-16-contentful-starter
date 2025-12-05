export const getFormattedDate = (dateString: string): string | null => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string provided: ${dateString}`);
    return null;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
