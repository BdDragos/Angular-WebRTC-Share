import bodyParser from "body-parser";
import cors from "cors";
import express, { Application } from "express";
import expressJwt from "express-jwt";
import { createServer, Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import path from "path";

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private DEFAULT_PORT = 5000;
  private USERS = [
    { id: 1, username: "admin" },
    { id: 2, username: "test" },
  ];

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

  getUsers() {
    return this.USERS;
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
