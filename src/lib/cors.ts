export const withCors = (r: Response, origin = '*') => {
  const h = new Headers(r.headers);
  h.set('Access-Control-Allow-Origin', origin);
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  h.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  return new Response(r.body, { status: r.status, headers: h });
};
export const json = (data: any, status = 200, origin = '*') =>
  withCors(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }), origin);
export const options = (origin = '*') =>
  withCors(new Response(null, { status: 204 }), origin);    