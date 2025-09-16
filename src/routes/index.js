import { Hono } from 'hono';
import dbping from './dbping';
// depois você importa users, auth, etc.

const routes = new Hono();

routes.route('/dbping', dbping);

export default routes;
