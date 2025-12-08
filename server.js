const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('public/db.json');
const middlewares = jsonServer.defaults();
const cors = require('cors');

const corsOptions = {
  origin: ['http://localhost:5173'], // Add other allowed origins here
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

server.use(cors(corsOptions));
server.use(middlewares);
server.use(router);

const port = 3001;
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});
