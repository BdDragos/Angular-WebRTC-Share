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

  private clients = [];
  private busyUsers = [];
  private numUsers = 0;

  private rooms: { owner: string; name: string; socket: any }[] = [];
  private userIds = {};

  private USERS = [
    { id: 1, username: 'admin' },
    { id: 2, username: 'test' }
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

        this.userIds[body.room] = 0;

        console.log('Room created, with #', body.room);

        return res.send({});
      }
    });

    this.app.post('/api/deleteRoom', (req, res) => {
      const body = req.body;

      const foundRoom = this.rooms.findIndex((e) => e.name === body.room);

      if (this.rooms[foundRoom] && this.rooms[foundRoom].owner === body.username) {
        this.rooms.splice(foundRoom, 1);

        delete this.userIds[body.room];

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
      var addedUser = false;
      console.log('user connected');

      socket.on('new-message', (data) => {
        socket.broadcast.to(data.toid).emit('new-message', data);
      });

      socket.on('add user', (username) => {
        if (addedUser) return;
        this.clients.push({
          id: socket.id,
          username: username,
          busy: false
        });
        // we store the username in the socket session for this client
        socket['username'] = username;
        ++this.numUsers;
        addedUser = true;
        socket.emit('login-user-count', {
          numUsers: this.numUsers
        });
        socket.emit('logged-user', {
          username: socket['username'],
          numUsers: this.numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
          username: socket['username'],
          numUsers: this.numUsers
        });

        setInterval(() => {
          socket.broadcast.emit('client-list', this.clients);
        }, 3000);
      });

      // when the client emits 'typing', we broadcast it to others
      socket.on('typing', () => {
        socket.broadcast.emit('typing', {
          username: socket['username']
        });
      });

      // when the client emits 'stop typing', we broadcast it to others
      socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
          username: socket['username']
        });
      });

      // when the user disconnects.. perform this
      socket.on('disconnect', () => {
        if (addedUser) {
          --this.numUsers;
          if (this.clients.length > 0) {
            var i = 0;
            this.clients.forEach((a) => {
              if (a.username == socket['username']) {
                this.clients.splice(i, 1);
              }
              i++;
            });
          }
          // var index = clients.indexOf(socket.username);
          // if (index !== -1) {
          //     clients.splice(index, 1);
          // }

          if (this.busyUsers.length > 0) {
            var i = 0;
            this.busyUsers.forEach((a) => {
              if (a.username == socket['username']) {
                this.busyUsers.splice(i, 1);
              }
              i++;
            });
          }
          // echo globally that this client has left
          socket.broadcast.emit('user-left', socket['username']);
        }
      });

      /***
       * Section Video call
       * following requests are used for video call
       */
      socket.on('video-call', (data) => {
        socket.broadcast.to(data.toid).emit('video-call', data);
      });
      socket.on('video-call-accept', (data) => {
        socket.broadcast.to(data.toid).emit('video-call-accept', data);
      });
      socket.on('video-call-reject', (data) => {
        socket.broadcast.to(data.toid).emit('video-call-reject', data);
      });
      socket.on('get-busy-user', () => {
        socket.broadcast.emit('get-busy-user', this.busyUsers);
      });
      socket.on('busy-user', () => {
        this.busyUsers.push({
          id: socket.id,
          username: socket['username']
        });
        socket.broadcast.emit('get-busy-user', this.busyUsers);
      });
      socket.on('end-video-call', (data) => {
        if (this.busyUsers.length > 0) {
          var usr1 = this.busyUsers.find((a) => a.username == socket['username']);
          var index1 = this.busyUsers.indexOf(usr1);
          this.busyUsers.splice(index1, 1);

          var usr2 = this.busyUsers.find((a) => a.username == data.toname);
          var index2 = this.busyUsers.indexOf(usr2);
          this.busyUsers.splice(index2, 1);
        }
        socket.broadcast.to(data.toid).emit('video-call-ended', data);
        socket.broadcast.emit('get-busy-user', this.busyUsers);
      });
      // when the caller emits 'call-request', this listens and executes
      socket.on('call-request', (data) => {
        // we tell the client to execute 'call-request'
        socket.broadcast.to(data.toid).emit('call-request', {
          username: socket['username'],
          data: data
        });
      });
    });
  }
}
