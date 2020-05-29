import bodyParser from "body-parser";
import cors from "cors";
import express, { Application } from "express";
import { createServer, Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import path from "path";
import socketIo from "socket.io";
import compression from "compression";
import toobusy from "node-toobusy";
import cookieParser from "cookie-parser";

export class Server {
  private readonly DEFAULT_PORT = 5000;
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIO.Server;

  private clients = [];
  private clientId = 0;

  private USERS = [
    { id: 1, username: "admin" },
    { id: 2, username: "test" },
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
    this.app.options("*", cors());

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.app.use(compression());
    this.app.use(cookieParser());

    this.app.use((req, res, next) => {
      if (toobusy()) {
        res.status(503);
        res.send("Server is busy");
      } else {
        next();
      }
    });

    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "HEAD, OPTIONS, GET, POST, PUT, PATCH, DELETE, CONNECT"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      next();
    });

    this.app.use((req, res, next) => {
      var err = new Error("Not Found");
      next(err);
    });

    // error handler
    this.app.use((err, req, res, next) => {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};

      res.status(err.status || 500);
      // uncomment to just send error as JSON
      res.send({ message: "404 Page Not Found..!" });
      // uncomment to render the error page
      // res.render('error');
    });

    this.httpServer = createServer(this.app);

    this.io = socketIo(this.httpServer);

    this.configureApp();
    this.handleLoginRequests();
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, "../public")));
    this.listenSocket();
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }

  private handleLoginRequests() {
    this.app.get("/", (req, res) => {
      res.send("Angular JWT Todo API Server");
    });

    this.app.post("/api/auth", (req, res) => {
      const body = req.body;
      const user = this.USERS.find((user) => user.username == body.username);
      if (!user || body.password != "1234") {
        return res.sendStatus(401);
      }

      const token = jwt.sign(
        { userID: user.id },
        "todo-app-super-shared-secret",
        { expiresIn: "2h" }
      );
      res.send({ token });

      return null;
    });
  }

  listenSocket() {
    this.io.on("connection", (socket) => {
      this.clientId++;

      var client = {
        clientId: this.clientId,
        socketId: socket.id,
      };

      this.clients.push(client);
      console.log(socket.id + " - client connected");
      this.io.emit("socketid", client);

      socket.on("clients", () => {
        this.io.emit("clients", this.clients);
      });

      socket.on("offer", (offer) => {
        this.clients.forEach((client) => {
          if (offer["to"] == client["clientId"]) {
            socket.broadcast.to(client["socketId"]).emit("offer", offer);
          }
        });
      });

      socket.on("answer", (answer) => {
        this.clients.forEach((client) => {
          if (answer["to"] == client["clientId"]) {
            socket.broadcast.to(client["socketId"]).emit("answer", answer);
          }
        });
      });

      socket.on("icecandidate", (candidate) => {
        this.clients.forEach((client) => {
          if (candidate["to"] == client["clientId"]) {
            socket.broadcast
              .to(client["socketId"])
              .emit("icecandidate", candidate);
          }
        });
      });

      socket.on("file", (file) => {
        this.clients.forEach((client) => {
          if (file["to"] == client["clientId"]) {
            socket.broadcast.to(client["socketId"]).emit("file", file);
          }
        });
      });

      socket.on("disconnect", function () {
        this.clients.forEach((client) => {
          if (client["socketId"] == socket.id) {
            var socketIndex = this.clients.indexOf(client);
            this.clients.splice(socketIndex, 1);
            console.log(socket.id + " - client disconnected");
            this.io.emit("clients", this.clients);
          }
        });
      });
    });
  }
}
