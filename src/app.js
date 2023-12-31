import express from "express";
import ApiRouter from "./routes/index.routes.js";
import viewRoutes from "./routes/views.routes.js";
import productWebSocket from "./websockets/product.websockets.js";
import chatWebSocket from "./websockets/chat.websockets.js";
import handlebars from "express-handlebars";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import "./passport/local.strategies.js";
import "./passport/github.strategies.js";
import "./passport/google.strategies.js";
import { Server } from "socket.io";
import { __dirname } from "./utils.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { mongoStoreOptions } from "./config/connection.js";
import config from "./config/config.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(session(mongoStoreOptions));

// Handlebars
const hbs = handlebars.create({
  helpers: {
    isInArray: function (value, array) {
      return array && array.includes(value);
    },
  },
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
const apiRoutes = new ApiRouter();
app.use("/api", apiRoutes.getRouter());
app.use("/", viewRoutes);

// Middleware
app.use(errorHandler);

// Server
const port = config.PORT;
const httpServer = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Websockets
const io = new Server(httpServer);
const productNamespace = io.of("/product");
const chatNamespace = io.of("/chat");
productWebSocket(productNamespace);
chatWebSocket(chatNamespace);
