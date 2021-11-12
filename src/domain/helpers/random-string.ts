export const getRandomString = (length: number) => {
  const p = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(length)].reduce(
    a => a + p[~~(Math.random() * p.length)],
    '',
  );
};
