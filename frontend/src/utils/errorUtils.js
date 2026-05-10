/**
 * Extracts and formats error messages from backend validation responses.
 * Handles both generic messages and structured validation errors (422).
 */
export const getErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (error.response?.status === 422 && error.response?.data?.errors) {
    const backendErrors = error.response.data.errors;
    // Map each error object { field: message } to just the message
    const messages = backendErrors.map(err => Object.values(err)[0]);
    return messages.join('. ');
  }

  return error.response?.data?.message || error.message || fallback;
};
