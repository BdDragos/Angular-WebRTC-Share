import bodyParser from "body-parser";
import express, { Application } from "express";
import expressJwt from "express-jwt";
import { createServer, Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import _ from "lodash";
import path from "path";
import socketIO, { Server as SocketIOServer } from "socket.io";

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;
  private readonly DEFAULT_PORT = 5000;

  TODOS = [
    { id: 1, user_id: 1, name: "Get Milk", completed: false },
    { id: 2, user_id: 1, name: "Fetch Kids", completed: true },
    { id: 3, user_id: 2, name: "Buy flowers for wife", completed: false },
    {
      id: 4,
      user_id: 3,
      name: "Finish Angular JWT Todo App",
      completed: false,
    },
  ];
  USERS = [
    { id: 1, username: "jemma" },
    { id: 2, username: "paul" },
    { id: 3, username: "sebastian" },
  ];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.app = express();

    this.app.use(bodyParser.json());
    this.app.use(
      expressJwt({ secret: "todo-app-super-shared-secret" }).unless({
        path: ["/api/auth"],
      })
    );

    this.httpServer = createServer(this.app);
    this.io = socketIO(this.httpServer);

    this.configureApp();

    this.handleLoginRequests();
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  private handleLoginRequests() {
    this.app.get("/", (req, res) => {
      res.send("Angular JWT Todo API Server");
    });

    this.app.post("/api/auth", (req, res) => {
      const body = req.body;

      const user = this.USERS.find((user) => user.username == body.username);
      if (!user || body.password != "todo") {
        return res.sendStatus(401);
      }

      var token = jwt.sign(
        { userID: user.id },
        "todo-app-super-shared-secret",
        { expiresIn: "2h" }
      );
      res.send({ token });
    });

    this.app.get("/api/todos", (req: any, res) => {
      res.type("json");
      res.send(this.getTodos(req.user.userID));
    });

    this.app.get("/api/todos/:id", (req, res) => {
      var todoID = req.params.id;
      res.type("json");
      res.send(this.getTodo(todoID));
    });

    this.app.get("/api/users", (req, res) => {
      res.type("json");
      res.send(this.getUsers());
    });
  }

  getTodos(userID) {
    var todos = _.filter(this.TODOS, ["user_id", userID]);

    return todos;
  }

  getTodo(todoID) {
    var todo = _.find(this.TODOS, (todo) => {
      return todo.id == todoID;
    });

    return todo;
  }

  getUsers() {
    return this.USERS;
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
