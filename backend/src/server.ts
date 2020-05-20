import bodyParser from "body-parser";
import express, { Application } from "express";
import { createServer, Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import _ from "lodash";
import path from "path";
import cors from "cors";
import expressJwt from "express-jwt";

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  // private io: SocketIOServer;
  private readonly DEFAULT_PORT = 5000;

  USERS = [{ id: 1, username: "abcd" }];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.app = express();
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(
      expressJwt({ secret: "todo-app-super-shared-secret" }).unless({
        path: ["/api/auth", "/"],
      })
    );

    this.httpServer = createServer(this.app);
    // this.io = socketIO(this.httpServer);

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

      return null;
    });
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
