export const zodErrorsToObject = (result) => {
  if (result.success) return {};

  return result.error.issues.reduce((errors, issue) => {
    const key = issue.path[0];
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
    return errors;
  }, {});
};
