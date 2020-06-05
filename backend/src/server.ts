import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Application } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import path from 'path';
import socketIo from 'socket.io';
import compression from 'compression';
import toobusy from 'node-toobusy';
import cookieParser from 'cookie-parser';

export class Server {
  private readonly DEFAULT_PORT = 5000;
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIO.Server;

  private clients = {};

  private rooms: { owner: string; name: string; socket: any }[] = [];

  private USERS = [
    { id: 1, username: 'Admin' },
    { id: 2, username: 'Dragos' },
    { id: 3, username: 'User_2' },
    { id: 4, username: 'User_3' }
  ];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.app = express();

    // this.app.use(
    //   expressJwt({ secret: "todo-app-super-shared-secret" }).unless({
    //     path: ["/api/auth", "/"],
    //   })
    // );

    this.app.use(cors());
    this.app.options('*', cors());

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.app.use(compression());
    this.app.use(cookieParser());

    this.app.use((req, res, next) => {
      if (toobusy()) {
        res.status(503);
        res.send('Server is busy');
      } else {
        next();
      }
    });

    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'HEAD, OPTIONS, GET, POST, PUT, PATCH, DELETE, CONNECT');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      next();
    });

    // error handler
    this.app.use((err, req, res, next) => {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      res.status(err.status || 500);
      res.send({ message: '404 Page Not Found..!' });
    });

    this.httpServer = createServer(this.app);

    this.io = socketIo(this.httpServer);

    this.configureApp();
    this.handleLoginRequests();
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, '../public')));
    this.listenSocket();
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }

  private handleLoginRequests() {
    this.app.get('/', (req, res) => {
      res.send('Angular JWT Todo API Server');
    });

    this.app.post('/api/auth', (req, res) => {
      const body = req.body;
      const user = this.USERS.find((user) => user.username == body.username);

      if (!user || body.password != '1234') {
        return res.sendStatus(401);
      }

      const token = jwt.sign({ userID: user.id }, 'todo-app-super-shared-secret', { expiresIn: '2h' });
      res.send({ token });

      return null;
    });

    this.app.post('/api/createRoom', (req, res) => {
      const body = req.body;

      const foundRoom = this.rooms.find((e) => e.name === body.room);

      if (foundRoom) {
        return res.sendStatus(400);
      } else {
        this.rooms.push({ owner: body.username, name: body.room, socket: [] });

        this.clients[body.room] = [];

        console.log('Room created, with #', body.room);

        return res.send({});
      }
    });

    this.app.post('/api/deleteRoom', (req, res) => {
      const body = req.body;

      const foundRoom = this.rooms.findIndex((e) => e.name === body.room);

      if (this.rooms[foundRoom] && this.rooms[foundRoom].owner === body.username) {
        this.rooms.splice(foundRoom, 1);

        delete this.clients[body.room];

        console.log('Room deleted, with #', body.room);

        return res.send({});
      } else {
        return res.sendStatus(400);
      }
    });

    this.app.get('/api/getRooms', (req, res) => {
      res.send(this.rooms);
    });
  }

  listenSocket() {
    this.io.on('connection', (socket) => {
      socket.on('add-user', (username, roomname) => {
        if (socket) {
          if (!this.clients) {
            this.clients = {};
          }

          if (!this.clients[roomname]) {
            this.clients[roomname] = [];
          }

          if (this.clients[roomname].find((e) => e.clientId === username)) {
            socket.emit('already-connected', { text: 'You are already connected' });

            socket.leave(socket['roomname']);
            socket.disconnect();
            return;
          }

          socket.join(roomname);

          const newClient = {
            socketId: socket.id,
            clientId: username
          };

          this.clients[roomname].push(newClient);

          // we store the username in the socket session for this client
          socket['username'] = username;
          socket['roomname'] = roomname;

          console.log(username + ' - client connected');

          socket.emit('currentSocket', newClient);
        }
      });

      socket.on('clients', () => {
        this.io.sockets.in(socket['roomname']).emit('clients', {
          clients: this.clients[socket['roomname']],
          socketIds: this.clients[socket['roomname']].map((e) => e.socketId)
        });
      });

      socket.on('offer', (offer) => {
        console.log('Offer arrived: ' + offer['to']);

        if (this.clients[socket['roomname']]) {
          this.clients[socket['roomname']].forEach((client) => {
            if (offer['to'] === client['socketId']) {
              socket.broadcast.to(client['socketId']).emit('offer', { offer: offer });
            }
          });
        }
      });

      socket.on('answer', (answer) => {
        console.log('Answer arrived: ' + answer['to']);

        if (this.clients[socket['roomname']]) {
          this.clients[socket['roomname']].forEach((client) => {
            if (answer['to'] === client['socketId']) {
              socket.broadcast.to(client['socketId']).emit('answer', { answer: answer });
            }
          });
        }
      });

      socket.on('icecandidate', (candidate) => {
        console.log('Icecandidate arrived: ' + candidate['to']);

        if (this.clients[socket['roomname']]) {
          this.clients[socket['roomname']].forEach((client) => {
            if (candidate['to'] === client['socketId']) {
              socket.broadcast.to(client['socketId']).emit('icecandidate', { candidate: candidate });
            }
          });
        }
      });

      socket.on('disconnect', () => {
        if (this.clients[socket['roomname']]) {
          this.clients[socket['roomname']].forEach((client) => {
            if (client['socketId'] == socket.id) {
              var socketIndex = this.clients[socket['roomname']].indexOf(client);
              this.clients[socket['roomname']].splice(socketIndex, 1);
              console.log(socket.id + ' - client disconnected');

              socket.leave(socket['roomname']);

              this.io.sockets.in(socket['roomname']).emit('clients', {
                clients: this.clients[socket['roomname']],
                socketIds: this.clients[socket['roomname']].map((e) => e.socketId)
              });

              this.io.sockets.in(socket['roomname']).emit('disconnected-client', { socketId: socket.id });
            }
          });
        }
      });

      socket.on('post-new-message', (newMessage: any) => {
        if (this.clients[socket['roomname']]) {
          this.io.sockets.in(socket['roomname']).emit('new-messages-received', {
            newMessage
          });
        }
      });
    });
  }
}
