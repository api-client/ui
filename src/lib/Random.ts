/* eslint-disable no-plusplus */
export function randomString(length: number = 8): string {
  let text = '';
  const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < length; i++) {
    text += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return text;
}
